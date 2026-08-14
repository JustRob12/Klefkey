import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, RefreshCw } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAppContext } from '../context/AppContext';
import { MainHeader } from '../components/MainHeader';
import { rf, theme } from '../theme';

interface GeneratorScreenProps {
  onOpenSettings?: () => void;
}

export const GeneratorScreen: React.FC<GeneratorScreenProps> = ({ onOpenSettings = () => {} }) => {
  const { showFeedback, colors, isDarkMode } = useAppContext();

  const [length, setLength] = useState<number>(18);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState<boolean>(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  const generatePassword = () => {
    let u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let l = 'abcdefghijklmnopqrstuvwxyz';
    let n = '0123456789';
    let s = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (avoidAmbiguous) {
      u = u.replace(/[IO]/g, '');
      l = l.replace(/[l]/g, '');
      n = n.replace(/[01]/g, '');
    }

    let charPool = '';
    if (includeUpper) charPool += u;
    if (includeLower) charPool += l;
    if (includeNumbers) charPool += n;
    if (includeSymbols) charPool += s;

    if (charPool === '') {
      charPool = l; // fallback
    }

    let res = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * charPool.length);
      res += charPool.charAt(idx);
    }
    setGeneratedPassword(res);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols, avoidAmbiguous]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generatedPassword);
    showFeedback('copy', 'Password Copied to Clipboard!');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Generated Password Box */}
        <View style={[styles.pwdCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.pwdText, { color: colors.text }]} selectable numberOfLines={3}>
            {generatedPassword}
          </Text>

          <View style={styles.pwdActions}>
            <TouchableOpacity
              style={[styles.pwdBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}
              onPress={generatePassword}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color={colors.text} />
              <Text style={[styles.pwdBtnText, { color: colors.text }]}>Regenerate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pwdBtn, { backgroundColor: colors.primary }]}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              <Copy size={18} color={isDarkMode ? '#09090b' : '#ffffff'} />
              <Text style={[styles.pwdBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
                Copy Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Length Controls */}
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Password Length</Text>
            <Text style={[styles.lengthNum, { color: colors.primary }]}>{length} Chars</Text>
          </View>

          {/* Quick length presets */}
          <View style={styles.presetRow}>
            {[8, 12, 16, 20, 24, 32].map((len) => (
              <TouchableOpacity
                key={len}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: length === len ? colors.primary : 'transparent',
                    borderColor: length === len ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setLength(len)}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color: length === len ? (isDarkMode ? '#09090b' : '#ffffff') : colors.text,
                      fontFamily: length === len ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                >
                  {len}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Character Toggles */}
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardHeaderTitle, { color: colors.textMuted }]}>CHARACTER TYPES</Text>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Uppercase Letters (A-Z)</Text>
            <Switch
              value={includeUpper}
              onValueChange={setIncludeUpper}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Lowercase Letters (a-z)</Text>
            <Switch
              value={includeLower}
              onValueChange={setIncludeLower}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Numbers (0-9)</Text>
            <Switch
              value={includeNumbers}
              onValueChange={setIncludeNumbers}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Special Symbols (!@#$%^&*)</Text>
            <Switch
              value={includeSymbols}
              onValueChange={setIncludeSymbols}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Exclude Ambiguous (1, l, I, 0, O)</Text>
            <Switch
              value={avoidAmbiguous}
              onValueChange={setAvoidAmbiguous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(22),
  },
  subtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(13),
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 16,
  },
  pwdCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  pwdText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(20),
    textAlign: 'center',
    letterSpacing: 1.2,
    lineHeight: 28,
  },
  pwdActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pwdBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  pwdBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(13),
  },
  strengthCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
  entropyBadge: {
    fontSize: rf(12),
  },
  trackBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  settingCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  settingLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
  lengthNum: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontSize: rf(13),
  },
  cardHeaderTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  toggleLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
  },
});
