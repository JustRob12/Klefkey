import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Switch,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, User, Fingerprint, ScanFace, Check } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

export const OnboardingSecurityScreen: React.FC = () => {
  const { setupSecurity, hasBiometricsHardware, biometricsType, colors, isDarkMode } = useAppContext();

  const [name, setName] = useState<string>('Rob');
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Name & PIN, Step 2: Confirm & Biometrics
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [enableBio, setEnableBio] = useState<boolean>(hasBiometricsHardware);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (step === 1) {
      if (pin.length < 6) {
        const next = pin + num;
        setPin(next);
        if (next.length === 6) {
          setTimeout(() => setStep(2), 200);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const next = confirmPin + num;
        setConfirmPin(next);
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    if (step === 1) {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleFinishSetup = async () => {
    if (name.trim() === '') {
      setErrorMsg('Please enter your name');
      return;
    }
    if (pin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    await setupSecurity(pin, enableBio, name.trim().slice(0, 6));
  };

  const currentPinLength = step === 1 ? pin.length : confirmPin.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Icon */}
        <View style={styles.headerArea}>
          <View
            style={[
              styles.logoBadgeContainer,
              {
                backgroundColor: isDarkMode ? colors.card : '#f8f9fa',
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              source={isDarkMode ? require('../../assets/logo-white.png') : require('../../assets/logo.png')}
              style={styles.logoBadge}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 1 ? 'Welcome to Klefkey' : 'Confirm & Enable Biometrics'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 1
              ? 'Enter your name and create a 6-digit Master PIN to secure your vault.'
              : 'Re-enter your Master PIN and configure biometric lock.'}
          </Text>
        </View>

        {/* Name Input (Step 1) */}
        {step === 1 && (
          <View style={styles.nameInputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>YOUR NAME (MAX 6 LETTERS)</Text>
            <View style={[styles.nameBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.nameInput, { color: colors.text }]}
                placeholder="e.g. Rob"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(val) => setName(val.slice(0, 6))}
                maxLength={6}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        {/* Step Progress Dots */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View
            style={[
              styles.stepDot,
              { backgroundColor: step === 2 ? colors.primary : colors.border },
            ]}
          />
        </View>

        {/* PIN Indicators */}
        <Text style={[styles.pinInstruction, { color: colors.textSecondary }]}>
          {step === 1 ? 'Set Master PIN' : 'Confirm Master PIN'}
        </Text>
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const filled = index < currentPinLength;
            return (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  {
                    borderColor: filled ? colors.primary : colors.border,
                    backgroundColor: filled ? colors.primary : 'transparent',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Error message if any */}
        {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}

        {/* Biometrics Toggle (Visible on Step 2) */}
        {step === 2 && (
          <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.bioLeft}>
              {biometricsType.includes('Face') ? (
                <ScanFace size={24} color={colors.text} />
              ) : (
                <Fingerprint size={24} color={colors.text} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.bioTitle, { color: colors.text }]}>
                  Enable {biometricsType}
                </Text>
                <Text style={[styles.bioSub, { color: colors.textMuted }]}>
                  {hasBiometricsHardware
                    ? `Unlock vault instantly with ${biometricsType}`
                    : 'Biometrics hardware will be enabled on device'}
                </Text>
              </View>
            </View>
            <Switch
              value={enableBio}
              onValueChange={setEnableBio}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#09090b' : '#ffffff'}
            />
          </View>
        )}

        {/* Custom Numeric Keypad */}
        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.keyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleKeyPress(num)}
              activeOpacity={0.7}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
          {/* Bottom Row */}
          <TouchableOpacity
            style={[styles.keyButton, { backgroundColor: 'transparent' }]}
            onPress={() => {
              if (step === 2) {
                setStep(1);
                setConfirmPin('');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionKeyText, { color: colors.textMuted }]}>
              {step === 2 ? 'Back' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.keyButton, { backgroundColor: 'transparent' }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionKeyText, { color: colors.text }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        {step === 2 && (
          <TouchableOpacity
            style={[
              styles.finishBtn,
              { backgroundColor: colors.primary, opacity: confirmPin.length >= 4 ? 1 : 0.5 },
            ]}
            onPress={handleFinishSetup}
            disabled={confirmPin.length < 4}
            activeOpacity={0.85}
          >
            <Check size={20} color={isDarkMode ? '#09090b' : '#ffffff'} />
            <Text style={[styles.finishBtnText, { color: isDarkMode ? '#09090b' : '#ffffff' }]}>
              Complete Setup
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  logoBadgeContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoBadge: {
    width: 44,
    height: 44,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(22),
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(13),
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  nameInputSection: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  pinInstruction: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  bioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bioTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
  bioSub: {
    fontFamily: theme.fonts.regular,
    fontSize: rf(11),
    marginTop: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    gap: 14,
    marginBottom: 20,
  },
  keyButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(24),
  },
  actionKeyText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    borderRadius: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
});
