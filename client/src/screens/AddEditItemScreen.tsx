import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Key,
  Mail,
  FileText,
  CreditCard,
  Lock,
  User,
  Globe,
  RefreshCw,
  Check,
  Eye,
  EyeOff,
  FolderIcon,
} from 'lucide-react-native';
import { useAppContext, VaultItem, ItemCategory, CARD_PALETTES } from '../context/AppContext';
import { ActionSheet } from '../components/ActionSheet';
import { rf, theme } from '../theme';

interface AddEditItemScreenProps {
  visible: boolean;
  itemToEdit: VaultItem | null;
  onClose: () => void;
}

export const AddEditItemScreen: React.FC<AddEditItemScreenProps> = ({
  visible,
  itemToEdit,
  onClose,
}) => {
  const {
    folders,
    currentFolderId,
    addItem,
    updateItem,
    showFeedback,
    colors,
    isDarkMode,
  } = useAppContext();

  const [category, setCategory] = useState<ItemCategory>('login');
  const [targetFolderId, setTargetFolderId] = useState<string | null>(currentFolderId);
  const [selectedColor, setSelectedColor] = useState<string>('default');
  const [title, setTitle] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Card specific state
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');

  useEffect(() => {
    if (itemToEdit) {
      setCategory(itemToEdit.category);
      setTargetFolderId(itemToEdit.folderId);
      setSelectedColor(itemToEdit.color || 'default');
      setTitle(itemToEdit.title);
      setUsername(itemToEdit.username || '');
      setEmail(itemToEdit.email || '');
      setPassword(itemToEdit.password || '');
      setWebsite(itemToEdit.website || '');
      setNotes(itemToEdit.notes || '');

      if (itemToEdit.cardDetails) {
        setCardNumber(itemToEdit.cardDetails.cardNumber || '');
        setCardHolder(itemToEdit.cardDetails.cardHolder || '');
        setExpiry(itemToEdit.cardDetails.expiry || '');
        setCvv(itemToEdit.cardDetails.cvv || '');
      }
    } else {
      setCategory('login');
      setTargetFolderId(currentFolderId);
      setSelectedColor('default');
      setTitle('');
      setUsername('');
      setEmail('');
      setPassword('');
      setWebsite('');
      setNotes('');
      setCardNumber('');
      setCardHolder('');
      setExpiry('');
      setCvv('');
    }
  }, [itemToEdit, visible, currentFolderId]);

  const generateQuickPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let res = '';
    for (let i = 0; i < 18; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
    showFeedback('success', 'Generated 18-char Secure Password');
  };

  const handleSave = async () => {
    if (title.trim() === '') {
      showFeedback('error', 'Please enter a Title');
      return;
    }

    const payload: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      category,
      folderId: targetFolderId,
      color: selectedColor,
      username: username.trim() || undefined,
      email: email.trim() || undefined,
      password: password.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
      isFavorite: itemToEdit ? itemToEdit.isFavorite : false,
      cardDetails:
        category === 'card'
          ? {
              cardNumber: cardNumber.trim() || undefined,
              cardHolder: cardHolder.trim() || undefined,
              expiry: expiry.trim() || undefined,
              cvv: cvv.trim() || undefined,
            }
          : undefined,
    };

    if (itemToEdit) {
      await updateItem(itemToEdit.id, payload);
    } else {
      await addItem(payload);
    }

    onClose();
  };

  const categories: { id: ItemCategory; label: string; icon: any }[] = [
    { id: 'login', label: 'Login', icon: Key },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'note', label: 'Note', icon: FileText },
  ];

  const submitFooter = (
    <TouchableOpacity
      style={[
        styles.saveBtn,
        { backgroundColor: colors.primary, opacity: title.trim() !== '' ? 1 : 0.5 },
      ]}
      onPress={handleSave}
      disabled={title.trim() === ''}
      activeOpacity={0.85}
    >
      <Check size={20} color={isDarkMode ? '#09090b' : '#ffffff'} />
      <Text style={[styles.saveBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
        {itemToEdit ? 'Save Changes' : 'Save Credential'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={itemToEdit ? 'Edit Credential' : 'Add New Credential'}
      footer={submitFooter}
    >
      <View style={styles.container}>
        {/* Category Selector Tabs */}
        <Text style={[styles.label, { color: colors.text }]}>Category</Text>
        <View style={styles.catRow}>
          {categories.map((c) => {
            const IconComponent = c.icon;
            const isSel = category === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSel ? colors.primary : colors.card,
                    borderColor: isSel ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.8}
              >
                <IconComponent
                  size={16}
                  color={isSel ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text}
                />
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: isSel ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text,
                      fontFamily: isSel ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Target Folder Selection Chips */}
        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Folder Location</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderScroll}>
          <TouchableOpacity
            style={[
              styles.folderChip,
              {
                backgroundColor: targetFolderId === null ? colors.primary : colors.card,
                borderColor: targetFolderId === null ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTargetFolderId(null)}
          >
            <Text
              style={[
                styles.folderChipText,
                { color: targetFolderId === null ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text },
              ]}
            >
              📁 Vault Root
            </Text>
          </TouchableOpacity>
          {folders.map((f) => {
            const isSel = targetFolderId === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.folderChip,
                  {
                    backgroundColor: isSel ? colors.primary : colors.card,
                    borderColor: isSel ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTargetFolderId(f.id)}
              >
                <Text
                  style={[
                    styles.folderChipText,
                    { color: isSel ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text },
                  ]}
                >
                  📁 {f.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Title Input */}
        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Title *</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="e.g. Google, Work Email, Netflix, WiFi"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Username / Email Input */}
        {category !== 'note' && category !== 'card' && (
          <>
            <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
              Username / Email
            </Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="username@domain.com"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {/* Password Field with Auto-Generator */}
        {category !== 'note' && category !== 'card' && (
          <>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TouchableOpacity onPress={generateQuickPassword} style={styles.genLink}>
                <RefreshCw size={14} color={colors.primary} />
                <Text style={[styles.genLinkText, { color: colors.primary }]}>Auto Generate</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter or generate password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color={colors.text} /> : <Eye size={18} color={colors.text} />}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Payment Card Fields */}
        {category === 'card' && (
          <>
            <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Card Number</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CreditCard size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="4532 •••• •••• 8892"
                placeholderTextColor={colors.textMuted}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.rowTwo}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Expiry</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.textMuted}
                    value={expiry}
                    onChangeText={setExpiry}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>CVV</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Cardholder Name</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="JOHN DOE"
                placeholderTextColor={colors.textMuted}
                value={cardHolder}
                onChangeText={setCardHolder}
                autoCapitalize="characters"
              />
            </View>
          </>
        )}

        {/* Website URL */}
        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Website URL (Optional)</Text>
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Globe size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="https://example.com"
            placeholderTextColor={colors.textMuted}
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
          />
        </View>

        {/* Secure Notes Area */}
        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Notes (Optional)</Text>
        <View style={[styles.textAreaBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Recovery codes, pin details, or extra instructions..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Accent Color Palette Selector */}
        <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
          Card Accent Color (Gradient to White)
        </Text>
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
  container: {
    paddingVertical: 8,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  genLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genLinkText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(12),
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  catChipText: {
    fontSize: rf(12),
  },
  folderScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  folderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  folderChipText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  textAreaBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 90,
  },
  textArea: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    gap: 10,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
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
});
