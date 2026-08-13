import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FolderPlus, Edit2, Check } from 'lucide-react-native';
import { useAppContext, Folder, CARD_PALETTES } from '../context/AppContext';
import { ActionSheet } from '../components/ActionSheet';
import { rf, theme } from '../theme';

interface AddFolderModalProps {
  visible: boolean;
  folderToEdit?: Folder | null;
  onClose: () => void;
}

export const AddFolderModal: React.FC<AddFolderModalProps> = ({
  visible,
  folderToEdit,
  onClose,
}) => {
  const { createFolder, updateFolder, currentFolderId, getFolderPath, colors, isDarkMode } = useAppContext();
  const [folderName, setFolderName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('default');

  useEffect(() => {
    if (folderToEdit) {
      setFolderName(folderToEdit.name);
      setSelectedColor(folderToEdit.color || 'default');
    } else {
      setFolderName('');
      setSelectedColor('default');
    }
  }, [folderToEdit, visible]);

  const path = getFolderPath(currentFolderId);
  const currentFolderName = path[path.length - 1]?.name || 'Vault';

  const handleSubmit = async () => {
    if (folderName.trim() === '') return;
    if (folderToEdit) {
      await updateFolder(folderToEdit.id, folderName.trim(), selectedColor);
    } else {
      await createFolder(folderName.trim(), currentFolderId, selectedColor);
    }
    setFolderName('');
    setSelectedColor('default');
    onClose();
  };

  const isEditing = !!folderToEdit;

  const submitFooter = (
    <TouchableOpacity
      style={[
        styles.submitBtn,
        {
          backgroundColor: colors.primary,
          opacity: folderName.trim() !== '' ? 1 : 0.5,
        },
      ]}
      onPress={handleSubmit}
      disabled={folderName.trim() === ''}
      activeOpacity={0.85}
    >
      <Check size={20} color={isDarkMode ? '#09090b' : '#ffffff'} />
      <Text style={[styles.submitBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
        {isEditing ? 'Save Changes' : 'Create Folder'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Rename / Edit Folder' : 'Create New Folder'}
      subtitle={isEditing ? `Original: ${folderToEdit?.name}` : `Location: ${currentFolderName}`}
      footer={submitFooter}
    >
      <View style={styles.formContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Folder Name</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isEditing ? (
            <Edit2 size={20} color={colors.primary} />
          ) : (
            <FolderPlus size={20} color={colors.primary} />
          )}
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. Work Accounts, Personal, Banking"
            placeholderTextColor={colors.textMuted}
            value={folderName}
            onChangeText={setFolderName}
            autoFocus
          />
        </View>

        {/* Color Palette Selector */}
        <Text style={[styles.label, { color: colors.text }]}>Folder Accent Color (Gradient)</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}
        >
          {CARD_PALETTES.map((palette) => {
            const isSelected = selectedColor === palette.id;
            return (
              <TouchableOpacity
                key={palette.id}
                style={[
                  styles.colorCircle,
                  { backgroundColor: palette.hex },
                  isSelected && styles.colorCircleSelected,
                ]}
                onPress={() => setSelectedColor(palette.id)}
                activeOpacity={0.8}
              >
                {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingVertical: 8,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: rf(15),
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 4,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
});
