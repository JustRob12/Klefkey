import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  FileSpreadsheet,
  Plus,
  Star,
  Share2,
  Trash2,
  Folder as FolderIcon,
  FolderPlus,
  MoreVertical,
  Edit2,
  Paperclip,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppContext, VaultItem, Folder, VaultFile, CARD_PALETTES } from '../context/AppContext';
import { DriveBreadcrumb } from '../components/DriveBreadcrumb';
import { ActionSheet } from '../components/ActionSheet';
import { FilePreviewModal } from '../components/FilePreviewModal';
import {
  formatFileSize,
  getFileTypeLabel,
  persistVaultFile,
  getFileTypeCategory,
  shareVaultFile,
  ALLOWED_DOC_MIMES,
  isAllowedDocFile,
  setSystemOperationActive,
} from '../utils/fileStorage';
import { rf, theme } from '../theme';

interface FilesScreenProps {
  onSelectItem: (item: VaultItem) => void;
  onAddFolder: () => void;
  onEditFolder: (folder: Folder) => void;
}

export const FilesScreen: React.FC<FilesScreenProps> = ({
  onSelectItem,
  onAddFolder,
  onEditFolder,
}) => {
  const {
    folders,
    currentFolderId,
    setCurrentFolderId,
    items,
    addItem,
    deleteItem,
    deleteFolder,
    toggleFavorite,
    searchQuery,
    showFeedback,
    showConfirm,
    colors,
    isDarkMode,
  } = useAppContext();

  const [selectedDocFilter, setSelectedDocFilter] = useState<'all' | 'pdf' | 'word' | 'excel' | 'favorites'>('all');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<Folder | null>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Subfolders in current folder (Files/Documents only)
  const currentFolders = folders.filter((f) => f.type === 'files' && f.parentId === currentFolderId);

  // Filter items that are documents (strictly PDF, Word, Excel - No images or videos)
  const currentDocItems = items.filter((item) => {
    if (item.category === 'image') return false;

    const hasAllowedDocFiles = item.files?.some(
      (f) => f.fileType === 'pdf' || f.fileType === 'word' || f.fileType === 'excel'
    );
    const isDocCategory = item.category === 'document';
    const isApplicable = isDocCategory || hasAllowedDocFiles;

    const containsImageOrVideo = item.files?.some((f) => f.fileType === 'image');
    if (!isApplicable || (item.files && item.files.length > 0 && !hasAllowedDocFiles)) return false;
    if (containsImageOrVideo && !hasAllowedDocFiles) return false;

    // Search query matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchFile = item.files?.some((f) => f.name.toLowerCase().includes(q));
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchTitle || matchFile || matchNotes;
    }

    if (item.folderId !== currentFolderId) return false;

    if (selectedDocFilter === 'favorites') return item.isFavorite;
    if (selectedDocFilter === 'pdf') {
      return item.files?.some((f) => f.fileType === 'pdf') || item.title.toLowerCase().endsWith('.pdf');
    }
    if (selectedDocFilter === 'word') {
      return item.files?.some((f) => f.fileType === 'word') || item.title.toLowerCase().includes('.doc');
    }
    if (selectedDocFilter === 'excel') {
      return (
        item.files?.some((f) => f.fileType === 'excel') ||
        item.title.toLowerCase().endsWith('.xls') ||
        item.title.toLowerCase().endsWith('.xlsx') ||
        item.title.toLowerCase().endsWith('.csv')
      );
    }

    return true;
  });

  const getCardGradient = (colorId?: string): [string, string] => {
    const palette = CARD_PALETTES.find((p) => p.id === colorId) || CARD_PALETTES[0];
    if (palette.id === 'default') {
      return [isDarkMode ? '#18181b' : '#f8f9fa', isDarkMode ? '#18181b' : '#ffffff'];
    }
    const startColor = isDarkMode ? palette.darkTint : palette.tint;
    const endColor = isDarkMode ? '#18181b' : '#ffffff';
    return [startColor, endColor];
  };

  // Direct Document Picker - Restricted to PDF, Word, and Excel only (Zero Images/Videos)
  const handleDirectPickDocuments = async () => {
    try {
      setSystemOperationActive(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_DOC_MIMES,
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const validDocs = result.assets.filter((doc) => isAllowedDocFile(doc.name, doc.mimeType || undefined));
        const blockedCount = result.assets.length - validDocs.length;

        if (validDocs.length === 0) {
          showFeedback('error', 'Pictures and videos are not allowed. Please select PDF, Word, or Excel files only.');
          return;
        }

        for (const doc of validDocs) {
          const name = doc.name;
          const savedUri = await persistVaultFile(doc.uri, name);
          const typeCategory = getFileTypeCategory(name, doc.mimeType || undefined);
          const vaultFile: VaultFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            uri: savedUri,
            mimeType: doc.mimeType || undefined,
            size: doc.size || 0,
            fileType: typeCategory,
            createdAt: new Date().toISOString(),
          };

          await addItem({
            title: name.replace(/\.[^/.]+$/, ''),
            category: 'document',
            folderId: currentFolderId,
            files: [vaultFile],
            color: 'default',
            isFavorite: false,
          });
        }

        if (blockedCount > 0) {
          showFeedback('success', `Saved ${validDocs.length} document(s). (${blockedCount} photo/video files blocked)`);
        } else {
          showFeedback('success', `Saved ${validDocs.length} document(s) to vault`);
        }
      }
    } catch (err) {
      console.warn('Doc pick error:', err);
      showFeedback('error', 'Could not open document picker');
    } finally {
      setSystemOperationActive(false);
    }
  };

  const handleShareFile = async (file: VaultFile) => {
    const success = await shareVaultFile(file.uri, file.mimeType, file.name);
    if (success) {
      showFeedback('success', `Exporting ${file.name}`);
    } else {
      showFeedback('error', 'Sharing is not supported on this device');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Documents' },
    { id: 'pdf', label: '📄 PDF Files' },
    { id: 'word', label: '📝 Word Docs' },
    { id: 'excel', label: '📊 Excel Sheets' },
    { id: 'favorites', label: '★ Favorites' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Folder Breadcrumbs with Add Folder Button on the side */}
      <DriveBreadcrumb
        rootName="Documents"
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => setCurrentFolderId(id)}
        onAddFolder={onAddFolder}
      />

      {/* Filter Tabs */}
      <View style={styles.topControlRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterTabs.map((tab) => {
            const isSelected = selectedDocFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedDocFilter(tab.id as any)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text,
                      fontFamily: isSelected ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        {/* Folders in Current Directory */}
        {currentFolders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                FOLDERS ({currentFolders.length})
              </Text>
            </View>

            <View style={styles.folderGrid}>
              {currentFolders.map((folder) => {
                const subCount = items.filter(
                  (i) =>
                    i.folderId === folder.id &&
                    (i.category === 'document' ||
                      i.files?.some((f) => f.fileType === 'pdf' || f.fileType === 'word' || f.fileType === 'excel')) &&
                    !i.files?.some((f) => f.fileType === 'image')
                ).length;
                const gradientColors = getCardGradient(folder.color);
                const palette = CARD_PALETTES.find((p) => p.id === folder.color);
                const accentHex = palette && palette.id !== 'default' ? palette.hex : null;

                return (
                  <TouchableOpacity
                    key={folder.id}
                    style={styles.folderCardWrapper}
                    onPress={() => setCurrentFolderId(folder.id)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.folderCard,
                        { borderColor: accentHex ? accentHex + '50' : colors.border },
                      ]}
                    >
                      <View style={styles.folderCardTop}>
                        <View
                          style={[
                            styles.folderIconBg,
                            {
                              backgroundColor: accentHex
                                ? accentHex + '25'
                                : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e9ecef'),
                            },
                          ]}
                        >
                          <FolderIcon size={20} color={accentHex || colors.text} />
                        </View>

                        <TouchableOpacity
                          style={styles.folderMenuBtn}
                          onPress={() => setSelectedFolderForAction(folder)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MoreVertical size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={[styles.folderName, { color: colors.text }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.7}
                      >
                        {folder.name}
                      </Text>
                      <Text style={[styles.folderItemCount, { color: colors.textMuted }]}>
                        {subCount} {subCount === 1 ? 'doc' : 'docs'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Documents Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              LOCKED DOCUMENTS ({currentDocItems.length})
            </Text>
          </View>

          {currentDocItems.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FileText size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Documents Stored</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Tap below to choose any PDF, Word, or Excel file from your device to lock immediately.
              </Text>
              <TouchableOpacity
                style={[styles.addInlineBtn, { backgroundColor: colors.primary }]}
                onPress={handleDirectPickDocuments}
                activeOpacity={0.85}
              >
                <Plus size={16} color={isDarkMode ? '#09090b' : '#ffffff'} />
                <Text style={[styles.addInlineBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
                  Choose Document (PDF / Word / Excel)
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            currentDocItems.map((item) => {
              const itemGradient = getCardGradient(item.color);
              const palette = CARD_PALETTES.find((p) => p.id === item.color);
              const accentHex = palette && palette.id !== 'default' ? palette.hex : null;

              const primaryFile = item.files && item.files.length > 0 ? item.files[0] : null;
              const isPdf = primaryFile ? primaryFile.fileType === 'pdf' : item.title.toLowerCase().endsWith('.pdf');
              const isWord = primaryFile ? primaryFile.fileType === 'word' : item.title.toLowerCase().includes('.doc');
              const isExcel = primaryFile
                ? primaryFile.fileType === 'excel'
                : item.title.toLowerCase().endsWith('.xls') ||
                  item.title.toLowerCase().endsWith('.xlsx') ||
                  item.title.toLowerCase().endsWith('.csv');

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    if (primaryFile) {
                      setPreviewFile(primaryFile);
                    } else {
                      onSelectItem(item);
                    }
                  }}
                  onLongPress={() =>
                    showConfirm(
                      'Delete Document',
                      `Are you sure you want to delete "${item.title}"?`,
                      () => deleteItem(item.id)
                    )
                  }
                  activeOpacity={0.85}
                  style={{ marginBottom: 10 }}
                >
                  <LinearGradient
                    colors={itemGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.docCard,
                      { borderColor: accentHex ? accentHex + '50' : colors.border },
                    ]}
                  >
                    <View style={styles.docLeft}>
                      {/* Document Type Icon Badge */}
                      <View
                        style={[
                          styles.docIconBg,
                          {
                            backgroundColor: isPdf
                              ? 'rgba(239, 68, 68, 0.14)'
                              : isWord
                              ? 'rgba(59, 130, 246, 0.14)'
                              : 'rgba(16, 185, 129, 0.14)',
                          },
                        ]}
                      >
                        {isExcel ? (
                          <FileSpreadsheet size={22} color="#10b981" />
                        ) : (
                          <FileText
                            size={22}
                            color={isPdf ? '#ef4444' : isWord ? '#3b82f6' : '#10b981'}
                          />
                        )}
                      </View>

                      {/* Document Info */}
                      <View style={{ flex: 1 }}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[styles.docTitle, { color: colors.text }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.7}
                          >
                            {item.title}
                          </Text>
                          {item.files && item.files.length > 1 && (
                            <View
                              style={[
                                styles.fileCountBadge,
                                {
                                  backgroundColor: isDarkMode
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(9,9,11,0.06)',
                                },
                              ]}
                            >
                              <Paperclip size={10} color={colors.text} />
                              <Text style={[styles.fileCountText, { color: colors.text }]}>
                                {item.files.length}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[styles.docSub, { color: colors.textSecondary }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.7}
                        >
                          {primaryFile
                            ? `${getFileTypeLabel(primaryFile.fileType, primaryFile.name)} • ${formatFileSize(primaryFile.size)}`
                            : isPdf
                            ? 'PDF Document'
                            : isWord
                            ? 'Word Document'
                            : isExcel
                            ? 'Excel Spreadsheet'
                            : 'Secure Document'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Actions */}
                    <View style={styles.docRight}>
                      {primaryFile && (
                        <TouchableOpacity
                          style={[
                            styles.actionIconButton,
                            {
                              backgroundColor: isDarkMode
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.06)',
                            },
                          ]}
                          onPress={() => handleShareFile(primaryFile)}
                        >
                          <Share2 size={15} color={colors.text} />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() => toggleFavorite(item.id)}
                      >
                        <Star
                          size={18}
                          color={item.isFavorite ? '#f59e0b' : colors.textMuted}
                          fill={item.isFavorite ? '#f59e0b' : 'none'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() =>
                          showConfirm(
                            'Delete Document',
                            `Are you sure you want to delete "${item.title}"?`,
                            () => deleteItem(item.id)
                          )
                        }
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Folder Action Sheet */}
      <ActionSheet
        visible={!!selectedFolderForAction}
        onClose={() => setSelectedFolderForAction(null)}
        title={selectedFolderForAction?.name}
        subtitle="Folder Actions"
      >
        <View style={styles.actionSheetContent}>
          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              const target = selectedFolderForAction;
              setSelectedFolderForAction(null);
              if (target) onEditFolder(target);
            }}
          >
            <Edit2 size={20} color={colors.text} />
            <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>Edit / Rename Folder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
            onPress={() => {
              const target = selectedFolderForAction;
              setSelectedFolderForAction(null);
              if (target) {
                showConfirm(
                  'Delete Folder',
                  `Are you sure you want to delete "${target.name}"? Items inside will be moved to Root Vault.`,
                  () => deleteFolder(target.id)
                );
              }
            }}
          >
            <Trash2 size={20} color="#ef4444" />
            <Text style={[styles.actionSheetOptionText, { color: '#ef4444' }]}>Delete Folder</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

      {/* Full Preview Modal */}
      <FilePreviewModal
        visible={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  filterScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 8,
    paddingVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: rf(12),
  },
  quickFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  quickFolderBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(12),
  },
  mainScroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.8,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  folderCardWrapper: {
    width: '48%',
  },
  folderCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  folderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  folderIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderMenuBtn: {
    padding: 4,
  },
  folderName: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
  folderItemCount: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 4,
  },
  emptyContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
    marginTop: 12,
  },
  emptySub: {
    fontFamily: theme.fonts.regular,
    fontSize: rf(13),
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  addInlineBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(13),
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fileCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  fileCountText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(10),
  },
  docTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
  docSub: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
  docRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetContent: {
    gap: 10,
    paddingVertical: 8,
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  actionSheetOptionText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
});
