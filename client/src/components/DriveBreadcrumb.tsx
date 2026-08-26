import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight, HardDrive, Folder as FolderIcon, FolderPlus } from 'lucide-react-native';
import { useAppContext, BreadcrumbItem } from '../context/AppContext';
import { rf, theme } from '../theme';

interface DriveBreadcrumbProps {
  currentFolderId: string | null;
  rootName?: string;
  onSelectFolder: (folderId: string | null) => void;
  onAddFolder?: () => void;
}

export const DriveBreadcrumb: React.FC<DriveBreadcrumbProps> = ({
  currentFolderId,
  rootName = 'Vault',
  onSelectFolder,
  onAddFolder,
}) => {
  const { getFolderPath, colors, isDarkMode } = useAppContext();
  const path: BreadcrumbItem[] = getFolderPath(currentFolderId, rootName);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          return (
            <React.Fragment key={item.id || 'root'}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  {
                    backgroundColor: isLast
                      ? (isDarkMode ? '#27272a' : '#e4e4e7')
                      : 'transparent',
                  },
                ]}
                onPress={() => onSelectFolder(item.id)}
                activeOpacity={0.7}
              >
                {index === 0 ? (
                  <HardDrive size={14} color={isLast ? colors.text : colors.textMuted} />
                ) : (
                  <FolderIcon size={14} color={isLast ? colors.text : colors.textMuted} />
                )}
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isLast ? colors.text : colors.textMuted,
                      fontFamily: isLast ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>

              {!isLast && (
                <ChevronRight size={14} color={colors.textMuted} style={styles.separator} />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {onAddFolder && (
        <TouchableOpacity
          style={[
            styles.addFolderBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={onAddFolder}
          activeOpacity={0.8}
        >
          <FolderPlus size={14} color={colors.text} />
          <Text style={[styles.addFolderBtnText, { color: colors.text }]}>Folder</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 4,
    flexGrow: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  chipText: {
    fontSize: rf(13),
  },
  separator: {
    marginHorizontal: 2,
  },
  addFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  addFolderBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(12),
  },
});
