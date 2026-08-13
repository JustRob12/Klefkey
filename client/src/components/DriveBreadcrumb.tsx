import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight, HardDrive, Folder as FolderIcon } from 'lucide-react-native';
import { useAppContext, BreadcrumbItem } from '../context/AppContext';
import { rf, theme } from '../theme';

interface DriveBreadcrumbProps {
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export const DriveBreadcrumb: React.FC<DriveBreadcrumbProps> = ({
  currentFolderId,
  onSelectFolder,
}) => {
  const { getFolderPath, colors, isDarkMode } = useAppContext();
  const path: BreadcrumbItem[] = getFolderPath(currentFolderId);

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
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
});
