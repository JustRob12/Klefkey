import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { FolderGit2, Plus, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

export type MainTabType = 'vault' | 'files' | 'images';

interface FloatingBottomBarProps {
  activeTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
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
  const filesScale = useRef(new Animated.Value(1)).current;
  const imagesScale = useRef(new Animated.Value(1)).current;

  const animateScale = (anim: Animated.Value, toVal: number) => {
    Animated.spring(anim, {
      toValue: toVal,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const tabs: { id: MainTabType; label: string; icon: any; scale: Animated.Value }[] = [
    { id: 'vault', label: 'Vault', icon: FolderGit2, scale: vaultScale },
    { id: 'files', label: 'Files', icon: FileText, scale: filesScale },
    { id: 'images', label: 'Photos', icon: ImageIcon, scale: imagesScale },
  ];

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* 1. Main Round Capsule Container holding 3 Tabs: Vault, Files, Photos */}
      <View
        style={[
          styles.mainNavContainer,
          {
            backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: colors.border,
          },
        ]}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPressIn={() => animateScale(tab.scale, 0.92)}
              onPressOut={() => animateScale(tab.scale, 1)}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.activePill,
                  isActive && {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(9, 9, 11, 0.08)',
                  },
                  { transform: [{ scale: tab.scale }] },
                ]}
              >
                <IconComponent
                  size={18}
                  color={isActive ? colors.primary : colors.textMuted}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.text : colors.textMuted,
                      fontFamily: isActive ? theme.fonts.bold : theme.fonts.medium,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
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
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 99,
  },
  mainNavContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    paddingHorizontal: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
  },
  tabLabel: {
    fontSize: rf(12),
  },
  plusTouchable: {
    borderRadius: 30,
  },
  separatePlusBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
