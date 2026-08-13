import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

interface MainHeaderProps {
  onOpenSettings: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ onOpenSettings }) => {
  const { userName, userAvatar, colors } = useAppContext();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.headerLeft}>
        <Text style={[styles.welcomeSubText, { color: colors.textMuted }]}>
          Welcome to Klefkey
        </Text>
        <Text
          style={[styles.userNameText, { color: colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {userName || 'Rob'}
        </Text>
        <Text style={[styles.taglineText, { color: colors.textSecondary }]}>
          Store your passwords & emails securely
        </Text>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.profileAvatarBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={onOpenSettings}
          activeOpacity={0.8}
        >
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitial, { color: colors.text }]}>
              {(userName || 'R').charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeSubText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.5,
  },
  userNameText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(24),
    letterSpacing: -0.5,
    marginVertical: 1,
  },
  taglineText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
  },
  headerRight: {
    marginLeft: 12,
  },
  profileAvatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(18),
  },
});
