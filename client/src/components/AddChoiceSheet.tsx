import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FolderPlus, KeyRound, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { ActionSheet } from './ActionSheet';
import { rf, theme } from '../theme';

interface AddChoiceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddFolder: () => void;
  onSelectAddCredential: () => void;
}

export const AddChoiceSheet: React.FC<AddChoiceSheetProps> = ({
  visible,
  onClose,
  onSelectAddFolder,
  onSelectAddCredential,
}) => {
  const { colors, isDarkMode } = useAppContext();

  return (
    <ActionSheet visible={visible} onClose={onClose} title="Add New Item" subtitle="Choose what you would like to create">
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
              Create a folder to organize passwords & emails
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Option 2: Add Credential */}
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
