import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanFace, Fingerprint, KeyRound, AlertCircle, Delete } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

export const LockScreen: React.FC = () => {
  const {
    unlockAppWithPin,
    unlockAppWithBiometrics,
    biometricsEnabled,
    biometricsType,
    colors,
    isDarkMode,
  } = useAppContext();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Trigger biometrics on mount if enabled
  useEffect(() => {
    if (biometricsEnabled) {
      const timer = setTimeout(() => {
        unlockAppWithBiometrics();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [biometricsEnabled]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    if (enteredPin.length < 6) {
      const next = enteredPin + num;
      setEnteredPin(next);

      if (next.length === 6) {
        const success = unlockAppWithPin(next);
        if (!success) {
          setErrorMsg('Incorrect Master PIN');
          triggerShake();
          setTimeout(() => setEnteredPin(''), 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg('');
    setEnteredPin(enteredPin.slice(0, -1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.content}>
        {/* Header Branding */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Klefkey</Text>
          <Text style={[styles.lockStatus, { color: colors.textSecondary }]}>
            Vault Locked
          </Text>
        </View>

        {/* PIN Dots Row */}
        <Animated.View
          style={[
            styles.dotsRow,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    borderColor: filled ? colors.primary : colors.border,
                    backgroundColor: filled ? colors.primary : 'transparent',
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error Feedback */}
        {errorMsg !== '' && (
          <View style={styles.errorRow}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Numeric Keypad */}
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

          {/* Biometrics Action Button */}
          <TouchableOpacity
            style={[
              styles.keyButton,
              {
                backgroundColor: biometricsEnabled
                  ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e4e4e7')
                  : 'transparent',
                borderColor: colors.border,
              },
            ]}
            onPress={unlockAppWithBiometrics}
            disabled={!biometricsEnabled}
            activeOpacity={0.7}
          >
            {biometricsType.includes('Face') ? (
              <ScanFace size={24} color={biometricsEnabled ? colors.text : colors.border} />
            ) : (
              <Fingerprint size={24} color={biometricsEnabled ? colors.text : colors.border} />
            )}
          </TouchableOpacity>

          {/* Zero key */}
          <TouchableOpacity
            style={[styles.keyButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
          </TouchableOpacity>

          {/* Delete key */}
          <TouchableOpacity
            style={[styles.keyButton, { backgroundColor: 'transparent' }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteText, { color: colors.text }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 14,
  },
  appName: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(26),
    letterSpacing: 0.5,
  },
  lockStatus: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
    height: 24,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
    color: '#ef4444',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(24),
  },
  deleteText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: rf(13),
  },
});
