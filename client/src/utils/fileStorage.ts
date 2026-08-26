import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export type SupportedFileType = 'image' | 'pdf' | 'word' | 'excel' | 'other';

export const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

export const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/x-csv',
  'text/comma-separated-values',
];

const DISALLOWED_IMAGE_VIDEO_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp', '.svg', '.tiff', '.ico',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.m4v', '.wmv', '.flv',
];

/**
 * Checks if a file is an image or video format.
 */
export const isImageOrVideoFile = (fileName: string, mimeType?: string): boolean => {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (mime.startsWith('image/') || mime.startsWith('video/')) {
    return true;
  }

  return DISALLOWED_IMAGE_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/**
 * Validates whether a file is an allowed Document (PDF, Word, Excel/CSV only).
 * Strictly disallows pictures and videos.
 */
export const isAllowedDocFile = (fileName: string, mimeType?: string): boolean => {
  if (isImageOrVideoFile(fileName, mimeType)) {
    return false;
  }

  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  const matchesExtension = ALLOWED_DOC_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const matchesMime = ALLOWED_DOC_MIMES.some((m) => mime.includes(m));

  return matchesExtension || matchesMime;
};

const VAULT_STORAGE_DIR = `${FileSystem.documentDirectory || ''}vault_storage/`;

/**
 * Ensures the dedicated sandbox vault_storage directory exists.
 */
export const ensureVaultDirectoryExists = async (): Promise<void> => {
  try {
    if (!FileSystem.documentDirectory) return;
    const dirInfo = await FileSystem.getInfoAsync(VAULT_STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(VAULT_STORAGE_DIR, { intermediates: true });
    }

    // Create .nomedia file so Android Media Scanner and file indexers ignore this folder
    const nomediaPath = `${VAULT_STORAGE_DIR}.nomedia`;
    const nomediaInfo = await FileSystem.getInfoAsync(nomediaPath);
    if (!nomediaInfo.exists) {
      await FileSystem.writeAsStringAsync(nomediaPath, '');
    }
  } catch (err) {
    console.warn('Could not create vault storage directory:', err);
  }
};

/**
 * Copies a selected file from cache or temp directory into permanent vault storage.
 */
export const persistVaultFile = async (sourceUri: string, originalName: string): Promise<string> => {
  try {
    if (!FileSystem.documentDirectory) return sourceUri;
    await ensureVaultDirectoryExists();

    const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
    const safeExt = extension ? `.${extension}` : '';
    const destFileName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
    const destUri = `${VAULT_STORAGE_DIR}${destFileName}`;

    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (err) {
    console.warn('Failed to copy file to vault sandbox, fallback to source URI:', err);
    return sourceUri;
  }
};

/**
 * Categorizes a file into image, pdf, word, excel, or other based on name and MIME.
 */
export const getFileTypeCategory = (fileName: string, mimeType?: string): SupportedFileType => {
  const lower = fileName.toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.heic') ||
    lower.endsWith('.bmp') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  if (mime.includes('pdf') || lower.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    mime.includes('msword') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.docx')
  ) {
    return 'word';
  }

  if (
    mime.includes('excel') ||
    mime.includes('spreadsheetml') ||
    mime.includes('csv') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx') ||
    lower.endsWith('.csv')
  ) {
    return 'excel';
  }

  return 'other';
};

/**
 * Returns a human-friendly format badge for the file type.
 */
export const getFileTypeLabel = (fileType: SupportedFileType, fileName: string): string => {
  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : '';
  switch (fileType) {
    case 'image':
      return ext ? `${ext} Image` : 'Image';
    case 'pdf':
      return 'PDF Document';
    case 'word':
      return ext === 'DOC' ? 'Word Document (.doc)' : 'Word Document (.docx)';
    case 'excel':
      return ext === 'CSV'
        ? 'CSV Spreadsheet (.csv)'
        : ext === 'XLS'
        ? 'Excel Spreadsheet (.xls)'
        : 'Excel Spreadsheet (.xlsx)';
    default:
      return ext ? `${ext} File` : 'Document';
  }
};

/**
 * Formats byte counts to KB / MB strings.
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return 'Size unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

let _isSystemOperationActive = false;
let _clearSystemOpTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Tracks if a native OS picker (gallery/document/share sheet) is active.
 * When active, auto-lock on AppState background transition is temporarily suppressed.
 */
export const setSystemOperationActive = (active: boolean): void => {
  if (_clearSystemOpTimeout) {
    clearTimeout(_clearSystemOpTimeout);
    _clearSystemOpTimeout = null;
  }
  if (active) {
    _isSystemOperationActive = true;
  } else {
    // Keep active for 1500ms after picker dismisses so AppState can transition back to 'active'
    _clearSystemOpTimeout = setTimeout(() => {
      _isSystemOperationActive = false;
      _clearSystemOpTimeout = null;
    }, 1500);
  }
};

export const isSystemOperationActive = (): boolean => _isSystemOperationActive;

/**
 * Shares or opens a file using the native OS sharing / viewer dialog.
 */
export const shareVaultFile = async (uri: string, mimeType?: string, fileName?: string): Promise<boolean> => {
  try {
    setSystemOperationActive(true);
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      setSystemOperationActive(false);
      return false;
    }
    await Sharing.shareAsync(uri, {
      mimeType: mimeType || undefined,
      dialogTitle: fileName ? `Open or Share ${fileName}` : 'Share Locked File',
      UTI: mimeType || undefined,
    });
    setSystemOperationActive(false);
    return true;
  } catch (err) {
    setSystemOperationActive(false);
    console.warn('Share file error:', err);
    return false;
  }
};

/**
 * Prompts the OS to delete original photos from the public gallery/camera roll
 * after they have been securely locked in the vault.
 */
export const deleteOriginalPhotosFromDevice = async (
  assets: Array<{ assetId?: string | null; uri: string }>
): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    const idsToDelete: string[] = [];
    for (const asset of assets) {
      if (asset.assetId) {
        idsToDelete.push(asset.assetId);
      } else {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset.uri);
          if (info && info.id) {
            idsToDelete.push(info.id);
          }
        } catch {
          // If asset info lookup fails, skip
        }
      }
    }

    if (idsToDelete.length > 0) {
      const deleted = await MediaLibrary.deleteAssetsAsync(idsToDelete);
      return deleted;
    }
    return false;
  } catch (err) {
    console.warn('Error deleting original photo assets:', err);
    return false;
  }
};

