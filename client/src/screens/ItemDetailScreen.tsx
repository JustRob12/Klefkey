import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  DimensionValue,
} from 'react-native';
import {
  X,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  FolderInput,
  ShieldCheck,
  ShieldAlert,
  Star,
  Globe,
  Mail,
  User,
  Lock,
  FileText,
  CreditCard,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppContext, VaultItem } from '../context/AppContext';
import { ActionSheet } from '../components/ActionSheet';
import { rf, theme } from '../theme';

interface ItemDetailScreenProps {
  visible: boolean;
  item: VaultItem | null;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
}

export const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({
  visible,
  item,
  onClose,
  onEdit,
}) => {
  const {
    folders,
    deleteItem,
    toggleFavorite,
    moveItemToFolder,
    showFeedback,
    showConfirm,
    colors,
    isDarkMode,
  } = useAppContext();

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showFolderPicker, setShowFolderPicker] = useState<boolean>(false);

  if (!item) return null;

  const currentFolder = folders.find((f) => f.id === item.folderId);

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    showFeedback('copy', `${label} Copied to Clipboard!`);
  };

  const handleOpenUrl = (url?: string) => {
    if (!url) return;
    let target = url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    Linking.openURL(target).catch(() => showFeedback('error', 'Could not open URL'));
  };

  // Password strength logic
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 14) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Weak', color: '#ef4444', pct: '33%' };
    if (score <= 4) return { label: 'Moderate', color: '#f59e0b', pct: '66%' };
    return { label: 'Strong / Enterprise', color: '#10b981', pct: '100%' };
  };

  const strength = item.password ? calculateStrength(item.password) : null;

  return (
    <>
      <ActionSheet visible={visible} onClose={onClose} title={item.title} subtitle={item.category.toUpperCase()}>
        {/* Action Buttons Top Bar */}
        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.chipAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => toggleFavorite(item.id)}
          >
            <Star
              size={16}
              color={item.isFavorite ? '#f59e0b' : colors.textMuted}
              fill={item.isFavorite ? '#f59e0b' : 'none'}
            />
            <Text style={[styles.chipActionText, { color: colors.text }]}>
              {item.isFavorite ? 'Favorited' : 'Favorite'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowFolderPicker(!showFolderPicker)}
          >
            <FolderInput size={16} color={colors.text} />
            <Text style={[styles.chipActionText, { color: colors.text }]}>
              {currentFolder ? currentFolder.name : 'Move Folder'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chipAction, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              onClose();
              onEdit(item);
            }}
          >
            <Edit size={16} color={colors.text} />
            <Text style={[styles.chipActionText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Folder Selection Expandable Dropdown */}
        {showFolderPicker && (
          <View style={[styles.folderPickerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Destination Folder</Text>
            <TouchableOpacity
              style={[
                styles.folderOption,
                item.folderId === null && { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' },
              ]}
              onPress={() => {
                moveItemToFolder(item.id, null);
                setShowFolderPicker(false);
              }}
            >
              <Text style={{ color: colors.text, fontFamily: theme.fonts.medium }}>📁 Root Vault</Text>
            </TouchableOpacity>

            {folders.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.folderOption,
                  item.folderId === f.id && { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' },
                ]}
                onPress={() => {
                  moveItemToFolder(item.id, f.id);
                  setShowFolderPicker(false);
                }}
              >
                <Text style={{ color: colors.text, fontFamily: theme.fonts.medium }}>📁 {f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Username / Email Section */}
        {(item.username || item.email) && (
          <View style={styles.sectionField}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>USERNAME / EMAIL</Text>
            <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} />
              <Text style={[styles.fieldText, { color: colors.text }]} selectable>
                {item.username || item.email}
              </Text>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => handleCopy((item.username || item.email)!, 'Username')}
              >
                <Copy size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Password Section */}
        {item.password && (
          <View style={styles.sectionField}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PASSWORD</Text>
            <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} />
              <Text style={[styles.fieldText, { color: colors.text }]} selectable>
                {showPassword ? item.password : '••••••••••••••••'}
              </Text>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} color={colors.text} /> : <Eye size={18} color={colors.text} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => handleCopy(item.password!, 'Password')}
              >
                <Copy size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Password Strength Rating Bar */}
            {strength && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text
                    style={[styles.strengthText, { color: colors.textMuted }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                  >
                    Strength: <Text style={{ color: strength.color, fontFamily: theme.fonts.bold }}>{strength.label}</Text>
                  </Text>
                </View>
                <View style={[styles.strengthTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: strength.pct as DimensionValue, backgroundColor: strength.color },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Website Section */}
        {item.website && (
          <View style={styles.sectionField}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>WEBSITE URL</Text>
            <TouchableOpacity
              style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleOpenUrl(item.website)}
            >
              <Globe size={18} color={colors.textMuted} />
              <Text style={[styles.fieldText, { color: colors.text }]} numberOfLines={1}>
                {item.website}
              </Text>
              <ExternalLink size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Card Details Section */}
        {item.cardDetails && (
          <View style={styles.sectionField}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PAYMENT CARD DETAILS</Text>
            <View style={[styles.cardBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardRow}>
                <CreditCard size={20} color={colors.text} />
                <Text style={[styles.cardNum, { color: colors.text }]}>{item.cardDetails.cardNumber}</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Holder: {item.cardDetails.cardHolder}</Text>
                <Text style={[styles.cardSub, { color: colors.textMuted }]}>Exp: {item.cardDetails.expiry}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Secure Notes Section */}
        {item.notes && (
          <View style={styles.sectionField}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>SECURE NOTES</Text>
            <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.text }]} selectable>
                {item.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Delete Item CTA */}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
          onPress={() => {
            onClose();
            showConfirm(
              'Delete Credential',
              `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
              () => deleteItem(item.id)
            );
          }}
          activeOpacity={0.8}
        >
          <Trash2 size={18} color="#ef4444" />
          <Text style={styles.deleteBtnText}>Delete Credential</Text>
        </TouchableOpacity>
      </ActionSheet>
    </>
  );
};

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chipAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipActionText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(12),
  },
  folderPickerBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  pickerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(12),
    marginBottom: 6,
  },
  folderOption: {
    padding: 10,
    borderRadius: 10,
  },
  sectionField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  fieldText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
  },
  copyIconButton: {
    padding: 6,
  },
  strengthBox: {
    marginTop: 8,
  },
  strengthHeader: {
    marginBottom: 4,
  },
  strengthText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardNum: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
    letterSpacing: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSub: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
  },
  notesBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 80,
  },
  notesText: {
    fontFamily: theme.fonts.regular,
    fontSize: rf(14),
    lineHeight: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  deleteBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
    color: '#ef4444',
  },
});
