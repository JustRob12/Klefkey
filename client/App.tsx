import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AppProvider, useAppContext, VaultItem, Folder } from './src/context/AppContext';
import { OnboardingSecurityScreen } from './src/screens/OnboardingSecurityScreen';
import { LockScreen } from './src/screens/LockScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { GeneratorScreen } from './src/screens/GeneratorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { AddEditItemScreen } from './src/screens/AddEditItemScreen';
import { AddFolderModal } from './src/screens/AddFolderModal';
import { AddChoiceSheet } from './src/components/AddChoiceSheet';
import { FloatingBottomBar } from './src/components/FloatingBottomBar';
import { MainHeader } from './src/components/MainHeader';
import { FeedbackModal } from './src/components/FeedbackModal';
import { ConfirmModal } from './src/components/ConfirmModal';

const MainApp: React.FC = () => {
  const {
    isInitializing,
    hasSetupPin,
    isLocked,
    colors,
    isDarkMode,
  } = useAppContext();

  // Navigation State (Full Page Views: vault | generator | settings)
  const [currentScreen, setCurrentScreen] = useState<'vault' | 'generator' | 'settings'>('vault');

  // Modal States
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState<boolean>(false);
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<VaultItem | null>(null);
  
  // Folder Creation / Rename States
  const [showAddFolderModal, setShowAddFolderModal] = useState<boolean>(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  if (isInitializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 1. Initial Onboarding Security Flow (Set up PIN & Biometrics)
  if (!hasSetupPin) {
    return <OnboardingSecurityScreen />;
  }

  // 2. Lock Screen (App is locked)
  if (isLocked) {
    return <LockScreen />;
  }

  // Handlers
  const handleSelectItem = (item: VaultItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleOpenAddChoice = () => {
    setShowAddChoiceModal(true);
  };

  const handleOpenEditModal = (item: VaultItem) => {
    setShowDetailModal(false);
    setItemToEdit(item);
    setShowAddEditModal(true);
  };

  const handleOpenEditFolder = (folder: Folder) => {
    setFolderToEdit(folder);
    setShowAddFolderModal(true);
  };

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Persistent Main Top Header (Only on Vault & Generator tabs so it never glitches/flashes) */}
      {currentScreen !== 'settings' && (
        <MainHeader onOpenSettings={() => setCurrentScreen('settings')} />
      )}

      {/* Screen Render */}
      <View style={styles.screenWrapper}>
        {currentScreen === 'vault' && (
          <VaultScreen
            onSelectItem={handleSelectItem}
            onOpenAddItemModal={() => setShowAddEditModal(true)}
            onOpenSettings={() => setCurrentScreen('settings')}
            onEditFolder={handleOpenEditFolder}
          />
        )}
        {currentScreen === 'generator' && (
          <GeneratorScreen onOpenSettings={() => setCurrentScreen('settings')} />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onBack={() => setCurrentScreen('vault')} />
        )}
      </View>

      {/* Floating Bottom Navigation Bar (Hidden when on Settings page) */}
      {currentScreen !== 'settings' && (
        <FloatingBottomBar
          activeTab={currentScreen as 'vault' | 'generator'}
          onSelectTab={(tab) => setCurrentScreen(tab)}
          onPressPlus={handleOpenAddChoice}
        />
      )}

      {/* Choice Sheet (Add Folder or Add Credential) */}
      <AddChoiceSheet
        visible={showAddChoiceModal}
        onClose={() => setShowAddChoiceModal(false)}
        onSelectAddFolder={() => {
          setFolderToEdit(null);
          setShowAddFolderModal(true);
        }}
        onSelectAddCredential={() => {
          setItemToEdit(null);
          setShowAddEditModal(true);
        }}
      />

      {/* Modals & Overlays */}
      <ItemDetailScreen
        visible={showDetailModal}
        item={selectedItem}
        onClose={() => setShowDetailModal(false)}
        onEdit={handleOpenEditModal}
      />

      <AddEditItemScreen
        visible={showAddEditModal}
        itemToEdit={itemToEdit}
        onClose={() => {
          setShowAddEditModal(false);
          setItemToEdit(null);
        }}
      />

      <AddFolderModal
        visible={showAddFolderModal}
        folderToEdit={folderToEdit}
        onClose={() => {
          setShowAddFolderModal(false);
          setFolderToEdit(null);
        }}
      />

      <FeedbackModal />
      <ConfirmModal />
    </SafeAreaView>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#09090b" />
      </View>
    );
  }

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  mainContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
});
