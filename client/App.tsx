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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AppProvider, useAppContext, VaultItem, Folder, VaultFile, ItemCategory, FolderType } from './src/context/AppContext';
import { persistVaultFile, getFileTypeCategory } from './src/utils/fileStorage';
import { OnboardingSecurityScreen } from './src/screens/OnboardingSecurityScreen';
import { LockScreen } from './src/screens/LockScreen';
import { VaultScreen } from './src/screens/VaultScreen';
import { FilesScreen } from './src/screens/FilesScreen';
import { ImagesScreen } from './src/screens/ImagesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { AddEditItemScreen } from './src/screens/AddEditItemScreen';
import { AddFolderModal } from './src/screens/AddFolderModal';
import { AddChoiceSheet } from './src/components/AddChoiceSheet';
import { FloatingBottomBar, MainTabType } from './src/components/FloatingBottomBar';
import { MainHeader } from './src/components/MainHeader';
import { FeedbackModal } from './src/components/FeedbackModal';
import { ConfirmModal } from './src/components/ConfirmModal';

const MainApp: React.FC = () => {
  const {
    isInitializing,
    hasSetupPin,
    isLocked,
    currentFolderId,
    setCurrentFolderId,
    addItem,
    showFeedback,
    colors,
    isDarkMode,
  } = useAppContext();

  // Navigation State (3 Main Tabs: vault | files | images + settings)
  const [currentScreen, setCurrentScreen] = useState<MainTabType | 'settings'>('vault');

  // Modal States
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState<boolean>(false);
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<VaultItem | null>(null);
  const [addInitialCategory, setAddInitialCategory] = useState<ItemCategory>('login');
  
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

  // Direct Gallery Photo Import (zero form modal)
  const handleDirectPickPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showFeedback('error', 'Gallery permission required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const name = asset.fileName || `Photo_${Date.now()}.jpg`;
          const savedUri = await persistVaultFile(asset.uri, name);
          const vaultFile: VaultFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            uri: savedUri,
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
            fileType: 'image',
            createdAt: new Date().toISOString(),
          };

          await addItem({
            title: name.replace(/\.[^/.]+$/, ''),
            category: 'image',
            folderId: currentFolderId,
            files: [vaultFile],
            color: 'default',
            isFavorite: false,
          });
        }
        showFeedback('success', `Saved ${result.assets.length} photo(s) to vault`);
      }
    } catch (err) {
      console.warn('Direct pick photo error:', err);
      showFeedback('error', 'Could not open gallery');
    }
  };

  // Direct Document Import (zero form modal)
  const handleDirectPickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/*',
          '*/*',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const doc of result.assets) {
          const name = doc.name;
          const savedUri = await persistVaultFile(doc.uri, name);
          const typeCategory = getFileTypeCategory(name, doc.mimeType || undefined);
          const vaultFile: VaultFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            uri: savedUri,
            mimeType: doc.mimeType || undefined,
            size: doc.size || 0,
            fileType: typeCategory,
            createdAt: new Date().toISOString(),
          };

          await addItem({
            title: name.replace(/\.[^/.]+$/, ''),
            category: 'document',
            folderId: currentFolderId,
            files: [vaultFile],
            color: 'default',
            isFavorite: false,
          });
        }
        showFeedback('success', `Saved ${result.assets.length} document(s) to vault`);
      }
    } catch (err) {
      console.warn('Direct pick doc error:', err);
      showFeedback('error', 'Could not open document picker');
    }
  };

  const handleSelectItem = (item: VaultItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
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

  const handleOpenAddFolder = () => {
    setFolderToEdit(null);
    setShowAddFolderModal(true);
  };

  const handleSelectTab = (tab: MainTabType) => {
    if (tab !== currentScreen) {
      setCurrentFolderId(null); // Reset directory to root when switching tabs so folders don't leak
      setCurrentScreen(tab);
    }
  };

  const currentFolderType: FolderType =
    currentScreen === 'files' ? 'files' : currentScreen === 'images' ? 'images' : 'vault';

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Persistent Main Top Header (Displayed on Vault, Files & Photos tabs) */}
      {currentScreen !== 'settings' && (
        <MainHeader onOpenSettings={() => setCurrentScreen('settings')} />
      )}

      {/* Screen Render */}
      <View style={styles.screenWrapper}>
        {currentScreen === 'vault' && (
          <VaultScreen
            onSelectItem={handleSelectItem}
            onOpenAddItemModal={() => {
              setItemToEdit(null);
              setAddInitialCategory('login');
              setShowAddEditModal(true);
            }}
            onOpenSettings={() => setCurrentScreen('settings')}
            onEditFolder={handleOpenEditFolder}
          />
        )}
        {currentScreen === 'files' && (
          <FilesScreen
            onSelectItem={handleSelectItem}
            onAddFolder={handleOpenAddFolder}
            onEditFolder={handleOpenEditFolder}
          />
        )}
        {currentScreen === 'images' && (
          <ImagesScreen
            onSelectItem={handleSelectItem}
            onAddFolder={handleOpenAddFolder}
            onEditFolder={handleOpenEditFolder}
          />
        )}
        {currentScreen === 'settings' && (
          <SettingsScreen onBack={() => setCurrentScreen('vault')} />
        )}
      </View>

      {/* Floating Bottom Navigation Bar with 3 Tabs: Vault, Files, Photos */}
      {currentScreen !== 'settings' && (
        <FloatingBottomBar
          activeTab={currentScreen as MainTabType}
          onSelectTab={handleSelectTab}
          onPressPlus={() => setShowAddChoiceModal(true)}
        />
      )}

      {/* Screen-Specific Choice Sheet (Ask: Add Folder or Upload Photo/Files/Credential) */}
      <AddChoiceSheet
        visible={showAddChoiceModal}
        screenType={currentFolderType}
        onClose={() => setShowAddChoiceModal(false)}
        onSelectAddFolder={handleOpenAddFolder}
        onSelectAddCredential={() => {
          setItemToEdit(null);
          setAddInitialCategory('login');
          setShowAddEditModal(true);
        }}
        onSelectUploadFiles={() => handleDirectPickDocuments()}
        onSelectUploadPhotos={() => handleDirectPickPhotos()}
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
        initialCategory={addInitialCategory}
        onClose={() => {
          setShowAddEditModal(false);
          setItemToEdit(null);
        }}
      />

      <AddFolderModal
        visible={showAddFolderModal}
        folderToEdit={folderToEdit}
        folderType={currentFolderType}
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
