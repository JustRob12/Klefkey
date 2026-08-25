import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FolderPlus, KeyRound, FileUp, Image as ImageIcon, ChevronRight } from 'lucide-react-native';
import { useAppContext, FolderType } from '../context/AppContext';
import { ActionSheet } from './ActionSheet';
import { rf, theme } from '../theme';

interface AddChoiceSheetProps {
  visible: boolean;
  screenType: 'vault' | 'files' | 'images';
  onClose: () => void;
  onSelectAddFolder: () => void;
  onSelectAddCredential: () => void;
  onSelectUploadFiles: () => void;
  onSelectUploadPhotos: () => void;
}

export const AddChoiceSheet: React.FC<AddChoiceSheetProps> = ({
  visible,
  screenType,
  onClose,
  onSelectAddFolder,
  onSelectAddCredential,
  onSelectUploadFiles,
  onSelectUploadPhotos,
}) => {
  const { colors, isDarkMode } = useAppContext();

  const getSheetTitle = () => {
    switch (screenType) {
      case 'files':
        return 'Add to Documents';
      case 'images':
        return 'Add to Photos';
      default:
        return 'Add to Vault';
    }
  };

  const getSheetSubtitle = () => {
    switch (screenType) {
      case 'files':
        return 'Create a folder or upload documents';
      case 'images':
        return 'Create an album or upload photos';
      default:
        return 'Create a folder or save credentials';
    }
  };

  return (
    <ActionSheet visible={visible} onClose={onClose} title={getSheetTitle()} subtitle={getSheetSubtitle()}>
      <View style={styles.container}>
        {/* Option 1: Create Folder */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            onClose();
            onSelectAddFolder();
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e9ecef' }]}>
            <FolderPlus size={22} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>New Folder</Text>
            <Text style={[styles.optionSub, { color: colors.textMuted }]}>
              {screenType === 'files'
                ? 'Create a folder to organize documents & PDFs'
                : screenType === 'images'
                ? 'Create an album folder for photos & scans'
                : 'Create a folder to organize passwords & logins'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Option 2: Screen-specific Upload/Add Action */}
        {screenType === 'vault' && (
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              onClose();
              onSelectAddCredential();
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e9ecef' }]}>
              <KeyRound size={22} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>New Credential</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Save passwords, emails, financial cards, or notes
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {screenType === 'files' && (
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              onClose();
              onSelectUploadFiles();
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e9ecef' }]}>
              <FileUp size={22} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Upload Document</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Choose PDF files, Word docs (.docx/.doc), or spreadsheets
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {screenType === 'images' && (
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              onClose();
              onSelectUploadPhotos();
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e9ecef' }]}>
              <ImageIcon size={22} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Upload Photo</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>
                Choose photos, ID scans, or screenshots from gallery
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  optionSub: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
});
