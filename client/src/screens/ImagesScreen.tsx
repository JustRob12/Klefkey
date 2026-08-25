import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image as ImageIcon,
  Plus,
  Star,
  Trash2,
  Folder as FolderIcon,
  FolderPlus,
  MoreVertical,
  Edit2,
  Layers,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext, VaultItem, Folder, VaultFile, CARD_PALETTES } from '../context/AppContext';
import { DriveBreadcrumb } from '../components/DriveBreadcrumb';
import { ActionSheet } from '../components/ActionSheet';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { formatFileSize, persistVaultFile, shareVaultFile } from '../utils/fileStorage';
import { rf, theme } from '../theme';

interface ImagesScreenProps {
  onSelectItem: (item: VaultItem) => void;
  onAddFolder: () => void;
  onEditFolder: (folder: Folder) => void;
}

export const ImagesScreen: React.FC<ImagesScreenProps> = ({
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

  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<'all' | 'favorites'>('all');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<Folder | null>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Subfolders in current folder (Photos/Albums only)
  const currentFolders = folders.filter((f) => f.type === 'images' && f.parentId === currentFolderId);

  // Filter items that are images or have attached image files
  const currentImageItems = items.filter((item) => {
    const isImageCategory = item.category === 'image';
    const hasImageFiles = item.files?.some((f) => f.fileType === 'image');
    const isApplicable = isImageCategory || hasImageFiles;

    if (!isApplicable) return false;

    // Search query matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchFile = item.files?.some((f) => f.name.toLowerCase().includes(q));
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchTitle || matchFile || matchNotes;
    }

    if (item.folderId !== currentFolderId) return false;

    if (selectedPhotoFilter === 'favorites') return item.isFavorite;

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

  // Direct Photo Picker - Opens Gallery directly without modal
  const handleDirectPickPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showFeedback('error', 'Gallery permission required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const name = asset.fileName || `Photo_${Date.now()}.jpg`;
          const savedUri = await persistVaultFile(asset.uri, name);
          const vaultFile: VaultFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            uri: savedUri,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
            fileType: 'image',
            createdAt: new Date().toISOString(),
          };

          await addItem({
            title: name.replace(/\.[^/.]+$/, ''),
            category: 'image',
            folderId: currentFolderId,
            files: [vaultFile],
            color: 'default',
            isFavorite: false,
          });
        }
        showFeedback('success', `Saved ${result.assets.length} photo(s) to vault`);
      }
    } catch (err) {
      console.warn('Direct pick photo error:', err);
      showFeedback('error', 'Could not open photo gallery');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Folder Breadcrumbs */}
      <DriveBreadcrumb
        rootName="Photos"
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => setCurrentFolderId(id)}
      />

      {/* Filter Tabs & Quick Folder Button */}
      <View style={styles.topControlRow}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedPhotoFilter === 'all' ? colors.primary : colors.card,
                borderColor: selectedPhotoFilter === 'all' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedPhotoFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedPhotoFilter === 'all' ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text,
                  fontFamily: selectedPhotoFilter === 'all' ? theme.fonts.bold : theme.fonts.medium,
                },
              ]}
            >
              All Photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedPhotoFilter === 'favorites' ? colors.primary : colors.card,
                borderColor: selectedPhotoFilter === 'favorites' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedPhotoFilter('favorites')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedPhotoFilter === 'favorites' ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text,
                  fontFamily: selectedPhotoFilter === 'favorites' ? theme.fonts.bold : theme.fonts.medium,
                },
              ]}
            >
              ★ Favorites
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add Folder Button */}
        <TouchableOpacity
          style={[
            styles.quickFolderBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={onAddFolder}
          activeOpacity={0.8}
        >
          <FolderPlus size={16} color={colors.text} />
          <Text style={[styles.quickFolderBtnText, { color: colors.text }]}>Folder</Text>
        </TouchableOpacity>
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
                  (i) => i.folderId === folder.id && (i.category === 'image' || i.files?.some((f) => f.fileType === 'image'))
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
                        {subCount} {subCount === 1 ? 'photo' : 'photos'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Photos Grid Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              LOCKED PHOTOS & SCANS ({currentImageItems.length})
            </Text>
          </View>

          {currentImageItems.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ImageIcon size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Photos Locked Yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Tap below to open your gallery directly and choose photos or screenshots to lock immediately.
              </Text>
              <TouchableOpacity
                style={[styles.addInlineBtn, { backgroundColor: colors.primary }]}
                onPress={handleDirectPickPhotos}
                activeOpacity={0.85}
              >
                <Plus size={16} color={isDarkMode ? '#09090b' : '#ffffff'} />
                <Text style={[styles.addInlineBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
                  Choose Photo from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {currentImageItems.map((item) => {
                const imageFile = item.files?.find((f) => f.fileType === 'image');
                const imageUri = imageFile ? imageFile.uri : null;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.photoCardWrapper}
                    onPress={() => {
                      if (imageFile) {
                        setPreviewFile(imageFile);
                      } else {
                        onSelectItem(item);
                      }
                    }}
                    onLongPress={() =>
                      showConfirm(
                        'Delete Photo',
                        `Are you sure you want to delete "${item.title}"?`,
                        () => deleteItem(item.id)
                      )
                    }
                    activeOpacity={0.88}
                  >
                    <View
                      style={[
                        styles.photoCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      {/* Photo Thumbnail */}
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.photoImage} />
                      ) : (
                        <View style={[styles.photoFallback, { backgroundColor: isDarkMode ? '#1e1e24' : '#f1f5f9' }]}>
                          <ImageIcon size={32} color={colors.primary} />
                        </View>
                      )}

                      {/* Favorite Badge Overlay */}
                      {item.isFavorite && (
                        <View style={styles.favBadge}>
                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        </View>
                      )}

                      {/* Multiple Images Badge */}
                      {item.files && item.files.length > 1 && (
                        <View style={styles.multiBadge}>
                          <Layers size={11} color="#ffffff" />
                          <Text style={styles.multiBadgeText}>{item.files.length}</Text>
                        </View>
                      )}

                      {/* Caption Bar */}
                      <View style={[styles.photoCaptionBar, { backgroundColor: isDarkMode ? '#18181b' : '#ffffff' }]}>
                        <Text
                          style={[styles.photoTitleText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[styles.photoSubText, { color: colors.textMuted }] }
                          numberOfLines={1}
                        >
                          {imageFile ? formatFileSize(imageFile.size) : 'Locked Photo'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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

      {/* Full Screen Image Preview Modal */}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCardWrapper: {
    width: '48%',
  },
  photoCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  photoFallback: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 3,
  },
  multiBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(10),
    color: '#ffffff',
  },
  photoCaptionBar: {
    padding: 10,
  },
  photoTitleText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(13),
  },
  photoSubText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(11),
    marginTop: 2,
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
