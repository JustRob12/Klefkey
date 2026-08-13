import React from 'react';
import { ActionSheet } from '../components/ActionSheet';
import { SettingsScreen } from './SettingsScreen';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  return (
    <ActionSheet visible={visible} onClose={onClose} title="Security & Settings">
      <SettingsScreen />
    </ActionSheet>
  );
};
