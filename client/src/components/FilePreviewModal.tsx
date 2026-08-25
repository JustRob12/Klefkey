import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  X,
  Share2,
  FileText,
  FileSpreadsheet,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppContext, VaultFile } from '../context/AppContext';
import { formatFileSize, getFileTypeLabel, shareVaultFile } from '../utils/fileStorage';
import { rf, theme } from '../theme';

interface FilePreviewModalProps {
  visible: boolean;
  file: VaultFile | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  visible,
  file,
  onClose,
}) => {
  const { colors, isDarkMode, showFeedback } = useAppContext();

  if (!file) return null;

  const isImage = file.fileType === 'image';
  const isPdf = file.fileType === 'pdf';
  const isWord = file.fileType === 'word';

  const handleShare = async () => {
    const success = await shareVaultFile(file.uri, file.mimeType, file.name);
    if (success) {
      showFeedback('success', 'File ready for sharing/export');
    } else {
      showFeedback('error', 'Sharing is not available on this device');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? '#121214' : '#ffffff',
              borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDarkMode ? '#27272a' : '#f4f4f5' }]}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={[styles.headerTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {file.name}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {getFileTypeLabel(file.fileType, file.name)} • {formatFileSize(file.size)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9' },
              ]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content Body */}
          <View style={styles.body}>
            {isImage ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: file.uri }}
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.docContainer}>
                <View
                  style={[
                    styles.docIconCircle,
                    {
                      backgroundColor: isPdf
                        ? 'rgba(239, 68, 68, 0.12)'
                        : isWord
                        ? 'rgba(59, 130, 246, 0.12)'
                        : 'rgba(16, 185, 129, 0.12)',
                    },
                  ]}
                >
                  <FileText
                    size={48}
                    color={isPdf ? '#ef4444' : isWord ? '#3b82f6' : '#10b981'}
                  />
                </View>

                <Text
                  style={[styles.docNameText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {file.name}
                </Text>

                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isPdf
                        ? 'rgba(239, 68, 68, 0.15)'
                        : isWord
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isPdf ? '#ef4444' : isWord ? '#3b82f6' : '#10b981' },
                    ]}
                  >
                    {isPdf ? 'PDF DOCUMENT' : isWord ? 'WORD DOCUMENT' : 'SECURE DOCUMENT'}
                  </Text>
                </View>

                <View style={styles.securityNote}>
                  <ShieldCheck size={14} color={colors.textMuted} />
                  <Text style={[styles.securityText, { color: colors.textMuted }]}>
                    Encrypted & locked inside app storage
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: isDarkMode ? '#27272a' : '#f4f4f5' }]}>
            <TouchableOpacity
              style={[
                styles.shareBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Share2 size={18} color={isDarkMode ? '#09090b' : '#ffffff'} />
              <Text
                style={[
                  styles.shareBtnText,
                  { color: isDarkMode ? '#09090b' : '#ffffff' },
                ]}
              >
                {isImage ? 'Share / Save Image' : 'Open in App / Share'}
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
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
  },
  headerSubtitle: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(12),
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  docContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  docIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  docNameText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(16),
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(11),
    letterSpacing: 0.6,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  securityText: {
    fontFamily: theme.fonts.medium,
    fontSize: rf(11),
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 10,
  },
  shareBtnText: {
    fontFamily: theme.fonts.bold,
    fontSize: rf(15),
  },
});
