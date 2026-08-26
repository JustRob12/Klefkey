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
  Folder as FolderIcon,
  Plus,
  Star,
  Copy,
  MoreVertical,
  Key,
  Mail,
  FileText,
  CreditCard,
  Grid,
  List,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppContext, VaultItem, Folder, CARD_PALETTES } from '../context/AppContext';
import { DriveBreadcrumb } from '../components/DriveBreadcrumb';
import { ActionSheet } from '../components/ActionSheet';
import { rf, theme } from '../theme';

interface VaultScreenProps {
  onSelectItem: (item: VaultItem) => void;
  onOpenAddItemModal: () => void;
  onOpenSettings: () => void;
  onAddFolder: () => void;
  onEditFolder: (folder: Folder) => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({
  onSelectItem,
  onOpenAddItemModal,
  onOpenSettings,
  onAddFolder,
  onEditFolder,
}) => {
  const {
    folders,
    currentFolderId,
    setCurrentFolderId,
    items,
    deleteItem,
    deleteFolder,
    toggleFavorite,
    searchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    showFeedback,
    showConfirm,
    colors,
    isDarkMode,
  } = useAppContext();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolderForAction, setSelectedFolderForAction] = useState<Folder | null>(null);

  // Filter folders inside current directory (Vault folders only)
  const currentFolders = folders.filter(
    (f) => (f.type === 'vault' || !f.type) && f.parentId === currentFolderId
  );

  // Filter vault items: STRICTLY Passwords, Emails, Cards, and Notes only
  const currentItems = items.filter((item) => {
    const isVaultItem =
      item.category === 'login' ||
      item.category === 'email' ||
      item.category === 'card' ||
      item.category === 'note';

    if (!isVaultItem) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchText =
        item.title.toLowerCase().includes(q) ||
        (item.username && item.username.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      return matchText;
    }

    if (item.folderId !== currentFolderId) return false;

    if (selectedCategoryFilter === 'favorites') return item.isFavorite;
    if (selectedCategoryFilter !== 'all') return item.category === selectedCategoryFilter;

    return true;
  });

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showFeedback('copy', `${label} Copied!`);
  };

  const getCategoryIcon = (category: string, tintColor?: string) => {
    const iconColor = tintColor || colors.primary;
    switch (category) {
      case 'login':
        return <Key size={18} color={iconColor} />;
      case 'email':
        return <Mail size={18} color={iconColor} />;
      case 'note':
        return <FileText size={18} color={iconColor} />;
      case 'card':
        return <CreditCard size={18} color={iconColor} />;
      default:
        return <Key size={18} color={iconColor} />;
    }
  };

  const categories = [
    { id: 'all', name: 'All Credentials' },
    { id: 'favorites', name: '★ Favorites' },
    { id: 'login', name: 'Logins' },
    { id: 'email', name: 'Emails' },
    { id: 'card', name: 'Cards' },
    { id: 'note', name: 'Notes' },
  ];

  const getCardGradient = (colorId?: string): [string, string] => {
    const palette = CARD_PALETTES.find((p) => p.id === colorId) || CARD_PALETTES[0];
    if (palette.id === 'default') {
      return [isDarkMode ? '#18181b' : '#f8f9fa', isDarkMode ? '#18181b' : '#ffffff'];
    }
    const startColor = isDarkMode ? palette.darkTint : palette.tint;
    const endColor = isDarkMode ? '#18181b' : '#ffffff';
    return [startColor, endColor];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Google Drive Breadcrumb Navigation */}
      <DriveBreadcrumb
        rootName="Vault"
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => setCurrentFolderId(id)}
        onAddFolder={onAddFolder}
      />

      {/* Category Filter Horizontal Chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategoryFilter(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected
                        ? (isDarkMode ? '#09090b' : '#ffffff')
                        : colors.text,
                      fontFamily: isSelected ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                >
                  {cat.name}
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
        {/* Folders Section (Vault Folders with Gradient) */}
        {currentFolders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                FOLDERS ({currentFolders.length})
              </Text>
              <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                {viewMode === 'grid' ? (
                  <List size={18} color={colors.textMuted} />
                ) : (
                  <Grid size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            <View style={viewMode === 'grid' ? styles.folderGrid : styles.folderList}>
              {currentFolders.map((folder) => {
                const subItemCount = items.filter(
                  (i) =>
                    i.folderId === folder.id &&
                    (i.category === 'login' ||
                      i.category === 'email' ||
                      i.category === 'card' ||
                      i.category === 'note')
                ).length;
                const gradientColors = getCardGradient(folder.color);
                const palette = CARD_PALETTES.find((p) => p.id === folder.color);
                const accentHex = palette && palette.id !== 'default' ? palette.hex : null;

                if (viewMode === 'list') {
                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={styles.folderCardListWrapper}
                      onPress={() => setCurrentFolderId(folder.id)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.folderCardList,
                          { borderColor: accentHex ? accentHex + '50' : colors.border },
                        ]}
                      >
                        <View style={styles.folderListLeft}>
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
                            <FolderIcon size={22} color={accentHex || colors.text} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.folderName, { color: colors.text }]}
                              numberOfLines={1}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.7}
                            >
                              {folder.name}
                            </Text>
                            <Text style={[styles.folderItemCountList, { color: colors.textMuted }]}>
                              {subItemCount} {subItemCount === 1 ? 'credential' : 'credentials'}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={styles.folderMenuBtn}
                          onPress={() => setSelectedFolderForAction(folder)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MoreVertical size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                }

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
                        styles.folderCardGrid,
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
                          <FolderIcon size={22} color={accentHex || colors.text} />
                        </View>

                        <TouchableOpacity
                          style={styles.folderMenuBtn}
                          onPress={() => setSelectedFolderForAction(folder)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MoreVertical size={18} color={colors.textMuted} />
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
                        {subItemCount} {subItemCount === 1 ? 'credential' : 'credentials'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Vault Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              CREDENTIALS & LOGINS ({currentItems.length})
            </Text>
          </View>

          {currentItems.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Key size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Credentials Found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Tap the (+) button below to store passwords, emails, financial cards, or create folders.
              </Text>
              <TouchableOpacity
                style={[styles.addInlineBtn, { backgroundColor: colors.primary }]}
                onPress={onOpenAddItemModal}
                activeOpacity={0.85}
              >
                <Plus size={16} color={isDarkMode ? '#09090b' : '#ffffff'} />
                <Text style={[styles.addInlineBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
                  Add Credential
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            currentItems.map((item) => {
              const itemGradient = getCardGradient(item.color);
              const palette = CARD_PALETTES.find((p) => p.id === item.color);
              const accentHex = palette && palette.id !== 'default' ? palette.hex : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectItem(item)}
                  onLongPress={() =>
                    showConfirm(
                      'Delete Credential',
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
                      styles.itemCard,
                      { borderColor: accentHex ? accentHex + '50' : colors.border },
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <View
                        style={[
                          styles.itemIconBg,
                          {
                            backgroundColor: accentHex
                              ? accentHex + '25'
                              : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#e9ecef'),
                          },
                        ]}
                      >
                        {getCategoryIcon(item.category, accentHex || colors.primary)}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.itemTitle, { color: colors.text }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.7}
                        >
                          {item.title}
                        </Text>
                        <Text
                          style={[styles.itemSubtitle, { color: colors.textSecondary }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.7}
                        >
                          {item.username || item.email || item.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemRight}>
                      {/* Quick Copy Password if available */}
                      {item.password && (
                        <TouchableOpacity
                          style={[
                            styles.actionIconButton,
                            {
                              backgroundColor: isDarkMode
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.06)',
                            },
                          ]}
                          onPress={() => handleCopy(item.password!, 'Password')}
                        >
                          <Copy size={15} color={colors.text} />
                        </TouchableOpacity>
                      )}

                      {/* Star Toggle */}
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

                      {/* Quick Delete */}
                      <TouchableOpacity
                        style={styles.actionIconButton}
                        onPress={() =>
                          showConfirm(
                            'Delete Credential',
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
                  `Are you sure you want to delete "${target.name}"? Credentials inside will be moved to Root Vault.`,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterScroll: {
    paddingHorizontal: 20,
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
  folderList: {
    gap: 10,
  },
  folderCardWrapper: {
    width: '48%',
  },
  folderCardListWrapper: {
    width: '100%',
  },
  folderCardGrid: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  folderCardList: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  folderItemCountList: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
  itemSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
  itemRight: {
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
