import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
}) => {
  const { colors } = useAppContext();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardContainer}
            >
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Drag Handle Indicator */}
                <View style={styles.handleBarContainer}>
                  <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
                </View>

                {/* Header */}
                {(title || subtitle) && (
                  <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
                      {subtitle && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                          {subtitle}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Scrollable Content Body (Inputs, Swatches, Categories) */}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.contentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  {children}
                </ScrollView>

                {/* Fixed Non-Scrollable Footer (Submit / Save Button) */}
                {footer && (
                  <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
                    {footer}
                  </View>
                )}
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '100%',
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(18),
  },
  subtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(13),
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contentContainer: {
    paddingBottom: 16,
  },
  footerContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
