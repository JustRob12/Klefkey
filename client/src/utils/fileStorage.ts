import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type SupportedFileType = 'image' | 'pdf' | 'word' | 'other';

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
 * Categorizes a file into image, pdf, word, or other based on name and MIME.
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
    lower.endsWith('.bmp')
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

/**
 * Shares or opens a file using the native OS sharing / viewer dialog.
 */
export const shareVaultFile = async (uri: string, mimeType?: string, fileName?: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return false;
    }
    await Sharing.shareAsync(uri, {
      mimeType: mimeType || undefined,
      dialogTitle: fileName ? `Open or Share ${fileName}` : 'Share Locked File',
      UTI: mimeType || undefined,
    });
    return true;
  } catch (err) {
    console.warn('Share file error:', err);
    return false;
  }
};
