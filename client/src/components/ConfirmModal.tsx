import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { rf, theme } from '../theme';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, hideConfirm, colors, isDarkMode } = useAppContext();

  if (!confirmModal.visible) return null;

  return (
    <Modal visible={confirmModal.visible} transparent animationType="none" onRequestClose={hideConfirm}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={hideConfirm}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: confirmModal.isDestructive ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)' }]}>
            <AlertTriangle size={26} color={confirmModal.isDestructive ? '#ef4444' : colors.text} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{confirmModal.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{confirmModal.message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}
              onPress={hideConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: confirmModal.isDestructive ? '#ef4444' : colors.primary },
              ]}
              onPress={confirmModal.onConfirm}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.btnText,
                  { color: confirmModal.isDestructive ? '#ffffff' : (isDarkMode ? '#09090b' : '#ffffff') },
                ]}
              >
                {confirmModal.confirmText || 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(18),
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(14),
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(14),
  },
});
