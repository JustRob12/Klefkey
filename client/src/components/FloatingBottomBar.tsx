import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { FolderGit2, Plus, KeyRound } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

interface FloatingBottomBarProps {
  activeTab: 'vault' | 'generator';
  onSelectTab: (tab: 'vault' | 'generator') => void;
  onPressPlus: () => void;
}

export const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  activeTab,
  onSelectTab,
  onPressPlus,
}) => {
  const { colors, isDarkMode } = useAppContext();

  // Animated Values for soft press physics
  const plusScale = useRef(new Animated.Value(1)).current;
  const vaultScale = useRef(new Animated.Value(1)).current;
  const genScale = useRef(new Animated.Value(1)).current;

  const animateScale = (anim: Animated.Value, toVal: number) => {
    Animated.spring(anim, {
      toValue: toVal,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* 1. Main Round Capsule Container holding Vault & Generator */}
      <View
        style={[
          styles.mainNavContainer,
          {
            backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Vault Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPressIn={() => animateScale(vaultScale, 0.92)}
          onPressOut={() => animateScale(vaultScale, 1)}
          onPress={() => onSelectTab('vault')}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.activePill,
              activeTab === 'vault' && {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(9, 9, 11, 0.08)',
              },
              { transform: [{ scale: vaultScale }] },
            ]}
          >
            <FolderGit2
              size={19}
              color={activeTab === 'vault' ? colors.primary : colors.textMuted}
              strokeWidth={activeTab === 'vault' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'vault' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'vault' ? theme.fonts.bold : theme.fonts.medium,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              Vault
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Generator Tab */}
        <TouchableOpacity
          style={styles.tabButton}
          onPressIn={() => animateScale(genScale, 0.92)}
          onPressOut={() => animateScale(genScale, 1)}
          onPress={() => onSelectTab('generator')}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.activePill,
              activeTab === 'generator' && {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(9, 9, 11, 0.08)',
              },
              { transform: [{ scale: genScale }] },
            ]}
          >
            <KeyRound
              size={19}
              color={activeTab === 'generator' ? colors.primary : colors.textMuted}
              strokeWidth={activeTab === 'generator' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'generator' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'generator' ? theme.fonts.bold : theme.fonts.medium,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.7}
            >
              Generator
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* 2. Separate Floating Plus (+) Circle Button Positioned Beside Container */}
      <TouchableOpacity
        onPressIn={() => animateScale(plusScale, 0.88)}
        onPressOut={() => animateScale(plusScale, 1)}
        onPress={onPressPlus}
        activeOpacity={0.88}
        style={styles.plusTouchable}
      >
        <Animated.View
          style={[
            styles.separatePlusBtn,
            {
              backgroundColor: colors.primary,
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(9, 9, 11, 0.1)',
              transform: [{ scale: plusScale }],
            },
          ]}
        >
          <Plus size={26} color={isDarkMode ? '#09090b' : '#ffffff'} strokeWidth={2.8} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 26 : 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 99,
  },
  mainNavContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabLabel: {
    fontSize: rf(13),
  },
  plusTouchable: {
    borderRadius: 30,
  },
  separatePlusBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
});
