import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle, Trash2, Copy } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

export const FeedbackModal: React.FC = () => {
  const { feedback, hideFeedback, colors, isDarkMode } = useAppContext();

  useEffect(() => {
    if (feedback.visible) {
      const timer = setTimeout(() => {
        hideFeedback();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [feedback.visible]);

  if (!feedback.visible) return null;

  const renderIcon = () => {
    switch (feedback.type) {
      case 'success':
        return <CheckCircle2 size={20} color={isDarkMode ? '#ffffff' : '#09090b'} />;
      case 'copy':
        return <Copy size={20} color={isDarkMode ? '#ffffff' : '#09090b'} />;
      case 'delete':
        return <Trash2 size={20} color="#ef4444" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <CheckCircle2 size={20} color={colors.primary} />;
    }
  };

  return (
    <Modal visible={feedback.visible} transparent animationType="fade" onRequestClose={hideFeedback}>
      <View style={styles.overlay} pointerEvents="none">
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border,
            },
          ]}
        >
          {renderIcon()}
          <Text style={[styles.text, { color: colors.text }]}>{feedback.message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
});
