import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Lock,
  ScanFace,
  Fingerprint,
  Moon,
  Sun,
  Key,
  FolderGit2,
  Share2,
  ChevronLeft,
  Check,
  User,
  Camera,
  Edit2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import { ActionSheet } from '../components/ActionSheet';
import { rf, theme } from '../theme';

interface SettingsScreenProps {
  onBack?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const {
    userName,
    userAvatar,
    updateUserProfile,
    items,
    folders,
    biometricsEnabled,
    biometricsType,
    hasBiometricsHardware,
    updateSecuritySettings,
    lockApp,
    isDarkMode,
    toggleDarkMode,
    showFeedback,
    colors,
  } = useAppContext();

  // Profile Edit State
  const [profileName, setProfileName] = useState<string>(userName || 'Rob');
  const [avatarUri, setAvatarUri] = useState<string | null>(userAvatar);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // PIN Change State
  const [showChangePinSheet, setShowChangePinSheet] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  // Security audit stats
  const totalItems = items.length;
  const totalFolders = folders.length;
  const weakCount = items.filter((i) => i.password && i.password.length < 8).length;

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showFeedback('error', 'Gallery permission required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        await updateUserProfile(profileName, uri);
      }
    } catch (err) {
      console.log('Image pick error:', err);
      showFeedback('error', 'Could not pick image');
    }
  };

  const handleSaveProfile = async () => {
    if (profileName.trim() === '') {
      showFeedback('error', 'Name cannot be empty');
      return;
    }
    await updateUserProfile(profileName, avatarUri);
    setIsEditingProfile(false);
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) {
      showFeedback('error', 'PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      showFeedback('error', 'PINs do not match');
      return;
    }

    await updateSecuritySettings(newPin, undefined);
    setNewPin('');
    setConfirmPin('');
    setShowChangePinSheet(false);
  };

  const handleExportVault = async () => {
    const summary = items
      .map(
        (i) =>
          `Title: ${i.title}\nCategory: ${i.category}\nUser: ${i.username || i.email || 'N/A'}\nSite: ${i.website || 'N/A'
          }\n---`
      )
      .join('\n');
    await Clipboard.setStringAsync(summary);
    showFeedback('copy', 'Vault Audit Exported to Clipboard');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* Main Back Button Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Profile Card */}
          <View style={[styles.card, styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>USER PROFILE</Text>

            <View style={styles.profileHeaderRow}>
              {/* Avatar Circle with Camera Badge */}
              <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.85}>
                <View style={[styles.avatarCircle, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                  ) : (
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {(profileName || 'R').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                  <Camera size={12} color={isDarkMode ? '#09090b' : '#ffffff'} />
                </View>
              </TouchableOpacity>

              {/* User Name & Info */}
              <View style={{ flex: 1 }}>
                {isEditingProfile ? (
                  <View style={[styles.nameEditBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.nameInput, { color: colors.text }]}
                      value={profileName}
                      onChangeText={(val) => setProfileName(val.slice(0, 6))}
                      maxLength={6}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveProfile}>
                      <Check size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nameDisplayRow}>
                    <Text style={[styles.profileNameText, { color: colors.text }]}>{userName || 'Rob'}</Text>
                    <TouchableOpacity onPress={() => setIsEditingProfile(true)} style={{ padding: 4 }}>
                      <Edit2 size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={[styles.profileSubText, { color: colors.textMuted }]}>
                  Vault Owner (Max 6 letters)
                </Text>
              </View>
            </View>
          </View>

          {/* Lock Vault Immediate Button */}
          <TouchableOpacity
            style={[styles.lockCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={lockApp}
            activeOpacity={0.8}
          >
            <View style={styles.lockLeft}>
              <View style={[styles.lockIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Lock size={22} color="#ef4444" />
              </View>
              <View>
                <Text style={[styles.lockTitle, { color: colors.text }]}>Lock Vault Now</Text>
                <Text style={[styles.lockSub, { color: colors.textMuted }]}>
                  Requires PIN or Biometrics to reopen
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Vault Audit Stats Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>VAULT SECURITY AUDIT</Text>

            <View style={styles.statGrid}>
              <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                <Key size={18} color={colors.text} />
                <Text style={[styles.statNum, { color: colors.text }]}>{totalItems}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Items</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                <FolderGit2 size={18} color={colors.text} />
                <Text style={[styles.statNum, { color: colors.text }]}>{totalFolders}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Folders</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: colors.background }]}>
                <ShieldCheck size={18} color={weakCount > 0 ? '#ef4444' : '#10b981'} />
                <Text style={[styles.statNum, { color: weakCount > 0 ? '#ef4444' : '#10b981' }]}>
                  {weakCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Weak Pwds</Text>
              </View>
            </View>
          </View>

          {/* Security Controls */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>BIOMETRICS & MASTER PIN</Text>

            {/* Biometrics Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                {biometricsType.includes('Face') ? (
                  <ScanFace size={20} color={colors.text} />
                ) : (
                  <Fingerprint size={20} color={colors.text} />
                )}
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{biometricsType} Lock</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                    {hasBiometricsHardware ? 'Unlock via biometrics' : 'Supported on device'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={(val) => updateSecuritySettings(undefined, val)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
              />
            </View>

            {/* Change Master PIN */}
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setShowChangePinSheet(true)}
              activeOpacity={0.8}
            >
              <View style={styles.settingLeft}>
                <Key size={20} color={colors.text} />
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Change Master PIN</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>Update your 6-digit access PIN</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Appearance Mode */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>APPEARANCE</Text>

            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                {isDarkMode ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
                <View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>
                    {isDarkMode ? 'Monochrome Dark Mode' : 'Clean Light Mode'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>Switch theme palette</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
              />
            </View>
          </View>

          {/* Backup & Export */}
          <TouchableOpacity
            style={[styles.card, styles.exportRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleExportVault}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={colors.text} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Export Vault Summary (Clipboard)</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Change PIN ActionSheet */}
        <ActionSheet
          visible={showChangePinSheet}
          onClose={() => setShowChangePinSheet(false)}
          title="Change Master PIN"
        >
          <View style={{ gap: 14 }}>
            <Text style={[styles.sheetLabel, { color: colors.text }]}>New 6-Digit PIN</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter new PIN"
                placeholderTextColor={colors.textMuted}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
              />
            </View>

            <Text style={[styles.sheetLabel, { color: colors.text }]}>Confirm New PIN</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Re-enter new PIN"
                placeholderTextColor={colors.textMuted}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleChangePin}
              activeOpacity={0.85}
            >
              <Check size={20} color={isDarkMode ? '#09090b' : '#ffffff'} />
              <Text style={[styles.saveBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
                Update Master PIN
              </Text>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(18),
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 16,
  },
  profileCard: {},
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(24),
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileNameText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(20),
  },
  profileSubText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
  nameEditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  nameInput: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  saveNameBtn: {
    padding: 6,
  },
  lockCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  lockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lockIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
  lockSub: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(18),
  },
  statLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(11),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
  rowSub: {
    fontFamily: theme.fonts.regular,
    fontSize: rf(12),
    marginTop: 2,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
  },
  inputBox: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(15),
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
});
