import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  LayoutList,
  Grid3x3,
  Share2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext, VaultItem, Folder, VaultFile, CARD_PALETTES } from '../context/AppContext';
import { DriveBreadcrumb } from '../components/DriveBreadcrumb';
import { ActionSheet } from '../components/ActionSheet';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { formatFileSize, persistVaultFile, shareVaultFile, deleteOriginalPhotosFromDevice, setSystemOperationActive } from '../utils/fileStorage';
import { rf, theme } from '../theme';

export type PhotosViewMode = 'grid' | 'compact' | 'list';

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
    autoDeleteOriginalPhotos,
    colors,
    isDarkMode,
  } = useAppContext();

  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<'all' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<PhotosViewMode>('grid');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<Folder | null>(null);
  const [selectedItemForAction, setSelectedItemForAction] = useState<VaultItem | null>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Load view mode preference from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('@klefkey_photos_view_mode').then((saved) => {
      if (saved === 'grid' || saved === 'compact' || saved === 'list') {
        setViewMode(saved as PhotosViewMode);
      }
    });
  }, []);

  const handleSetViewMode = (mode: PhotosViewMode) => {
    setViewMode(mode);
    AsyncStorage.setItem('@klefkey_photos_view_mode', mode).catch(() => {});
  };

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

      setSystemOperationActive(true);
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

        if (autoDeleteOriginalPhotos) {
          const assetsToDelete = result.assets.map((a) => ({ assetId: a.assetId, uri: a.uri }));
          setTimeout(() => {
            showConfirm(
              'Delete from Public Gallery?',
              `Photo(s) are securely locked in Klefkey.\n\nWould you like to delete the original photo(s) from your public Gallery so they cannot be seen outside Klefkey?`,
              async () => {
                const deleted = await deleteOriginalPhotosFromDevice(assetsToDelete);
                if (deleted) {
                  showFeedback('delete', 'Deleted from public gallery');
                }
              },
              'Delete Originals',
              true
            );
          }, 400);
        }
      }
    } catch (err) {
      console.warn('Direct pick photo error:', err);
      showFeedback('error', 'Could not open photo gallery');
    } finally {
      setSystemOperationActive(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Folder Breadcrumbs with Add Folder Button on the side */}
      <DriveBreadcrumb
        rootName="Photos"
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => setCurrentFolderId(id)}
        onAddFolder={onAddFolder}
      />

      {/* Filter Tabs & View Mode */}
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
              ★ Favs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Controls: View Switcher (Grid / Compact / List) */}
        <View style={styles.rightControlGroup}>
          <View style={[styles.viewModeSegment, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                viewMode === 'grid' && [styles.viewModeBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => handleSetViewMode('grid')}
              activeOpacity={0.7}
            >
              <LayoutGrid
                size={15}
                color={viewMode === 'grid' ? (isDarkMode ? '#09090b' : '#ffffff') : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                viewMode === 'compact' && [styles.viewModeBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => handleSetViewMode('compact')}
              activeOpacity={0.7}
            >
              <Grid3x3
                size={15}
                color={viewMode === 'compact' ? (isDarkMode ? '#09090b' : '#ffffff') : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                viewMode === 'list' && [styles.viewModeBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => handleSetViewMode('list')}
              activeOpacity={0.7}
            >
              <LayoutList
                size={15}
                color={viewMode === 'list' ? (isDarkMode ? '#09090b' : '#ffffff') : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
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

        {/* Photos Section */}
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
          ) : viewMode === 'list' ? (
            /* ===== LIST VIEW WITH SMALL SIZE ICON ===== */
            <View style={styles.photoListContainer}>
              {currentImageItems.map((item) => {
                const imageFile = item.files?.find((f) => f.fileType === 'image');
                const imageUri = imageFile ? imageFile.uri : null;
                const formattedDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.photoListItem,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      if (imageFile) {
                        setPreviewFile(imageFile);
                      } else {
                        onSelectItem(item);
                      }
                    }}
                    onLongPress={() => setSelectedItemForAction(item)}
                    activeOpacity={0.78}
                  >
                    {/* Small Size Icon / Thumbnail */}
                    <View
                      style={[
                        styles.photoListThumbBox,
                        {
                          borderColor: colors.border,
                          backgroundColor: isDarkMode ? '#1e1e24' : '#f1f5f9',
                        },
                      ]}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.photoListThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <ImageIcon size={20} color={colors.primary} />
                      )}
                      {item.files && item.files.length > 1 && (
                        <View style={styles.listMultiBadge}>
                          <Text style={styles.listMultiBadgeText}>{item.files.length}</Text>
                        </View>
                      )}
                    </View>

                    {/* Metadata & Title */}
                    <View style={styles.photoListInfo}>
                      <Text
                        style={[styles.photoListTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <View style={styles.photoListMetaRow}>
                        <Text style={[styles.photoListMetaText, { color: colors.textMuted }]}>
                          {imageFile ? formatFileSize(imageFile.size) : 'Locked Photo'}
                        </Text>
                        {formattedDate ? (
                          <>
                            <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
                            <Text style={[styles.photoListMetaText, { color: colors.textMuted }]}>
                              {formattedDate}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    {/* Right Actions */}
                    <View style={styles.photoListRightActions}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Star
                          size={18}
                          color={item.isFavorite ? '#f59e0b' : colors.textMuted}
                          fill={item.isFavorite ? '#f59e0b' : 'transparent'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedItemForAction(item);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreVertical size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : viewMode === 'compact' ? (
            /* ===== COMPACT 3-COLUMN GRID WITH SMALL SIZE ICONS ===== */
            <View style={styles.compactPhotoGrid}>
              {currentImageItems.map((item) => {
                const imageFile = item.files?.find((f) => f.fileType === 'image');
                const imageUri = imageFile ? imageFile.uri : null;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.compactPhotoCardWrapper}
                    onPress={() => {
                      if (imageFile) {
                        setPreviewFile(imageFile);
                      } else {
                        onSelectItem(item);
                      }
                    }}
                    onLongPress={() => setSelectedItemForAction(item)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.compactPhotoCard,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.compactPhotoImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.compactPhotoFallback,
                            { backgroundColor: isDarkMode ? '#1e1e24' : '#f1f5f9' },
                          ]}
                        >
                          <ImageIcon size={22} color={colors.primary} />
                        </View>
                      )}

                      {/* Favorite Badge */}
                      {item.isFavorite && (
                        <View style={styles.compactFavBadge}>
                          <Star size={10} color="#f59e0b" fill="#f59e0b" />
                        </View>
                      )}

                      {/* Multi Badge */}
                      {item.files && item.files.length > 1 && (
                        <View style={styles.compactMultiBadge}>
                          <Text style={styles.compactMultiBadgeText}>{item.files.length}</Text>
                        </View>
                      )}

                      {/* Small Caption */}
                      <View
                        style={[
                          styles.compactCaptionBar,
                          { backgroundColor: isDarkMode ? '#18181b' : '#ffffff' },
                        ]}
                      >
                        <Text
                          style={[styles.compactPhotoTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* ===== STANDARD 2-COLUMN GRID ===== */
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
                    onLongPress={() => setSelectedItemForAction(item)}
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

      {/* Photo Item Action Sheet */}
      <ActionSheet
        visible={!!selectedItemForAction}
        onClose={() => setSelectedItemForAction(null)}
        title={selectedItemForAction?.title}
        subtitle="Photo Options"
      >
        <View style={styles.actionSheetContent}>
          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              const target = selectedItemForAction;
              setSelectedItemForAction(null);
              if (target) {
                const img = target.files?.find((f) => f.fileType === 'image');
                if (img) {
                  setPreviewFile(img);
                } else {
                  onSelectItem(target);
                }
              }
            }}
          >
            <ImageIcon size={20} color={colors.text} />
            <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>View Fullscreen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              const target = selectedItemForAction;
              setSelectedItemForAction(null);
              if (target) {
                toggleFavorite(target.id);
                showFeedback(
                  'success',
                  target.isFavorite ? 'Removed from favorites' : 'Added to favorites'
                );
              }
            }}
          >
            <Star
              size={20}
              color={selectedItemForAction?.isFavorite ? '#f59e0b' : colors.text}
              fill={selectedItemForAction?.isFavorite ? '#f59e0b' : 'transparent'}
            />
            <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>
              {selectedItemForAction?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              const target = selectedItemForAction;
              setSelectedItemForAction(null);
              if (target) {
                const img = target.files?.find((f) => f.fileType === 'image');
                if (img) {
                  shareVaultFile(img.uri, img.mimeType, img.name);
                }
              }
            }}
          >
            <Share2 size={20} color={colors.text} />
            <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>Share / Export Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSheetOption, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
            onPress={() => {
              const target = selectedItemForAction;
              setSelectedItemForAction(null);
              if (target) {
                showConfirm(
                  'Delete Photo',
                  `Are you sure you want to delete "${target.title}"?`,
                  () => deleteItem(target.id)
                );
              }
            }}
          >
            <Trash2 size={20} color="#ef4444" />
            <Text style={[styles.actionSheetOptionText, { color: '#ef4444' }]}>Delete Photo</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

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
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: rf(12),
  },
  rightControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  viewModeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickFolderBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* ===== LIST VIEW STYLES ===== */
  photoListContainer: {
    gap: 10,
  },
  photoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  photoListThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoListThumb: {
    width: '100%',
    height: '100%',
  },
  listMultiBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  listMultiBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(9),
    color: '#ffffff',
  },
  photoListInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  photoListTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
  photoListMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoListMetaText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(11),
  },
  metaDot: {
    fontSize: rf(10),
  },
  photoListRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
  },

  /* ===== COMPACT 3-COLUMN GRID STYLES ===== */
  compactPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactPhotoCardWrapper: {
    width: '31.3%',
  },
  compactPhotoCard: {
    width: '100%',
    aspectRatio: 0.92,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  compactPhotoImage: {
    width: '100%',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  compactPhotoFallback: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactFavBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMultiBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  compactMultiBadgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(9),
    color: '#ffffff',
  },
  compactCaptionBar: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  compactPhotoTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
  },

  /* ===== STANDARD 2-COLUMN GRID STYLES ===== */
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

  /* ===== ACTION SHEET STYLES ===== */
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
