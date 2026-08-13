import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { darkColors, lightColors, ColorsType } from '../theme';

export type ItemCategory = 'login' | 'email' | 'note' | 'card';

export interface CardInfo {
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  cvv?: string;
}

export interface CardColorPalette {
  id: string;
  name: string;
  hex: string;
  tint: string;
  darkTint: string;
}

export const CARD_PALETTES: CardColorPalette[] = [
  { id: 'default', name: 'Monochrome', hex: '#09090b', tint: 'rgba(9, 9, 11, 0.05)', darkTint: 'rgba(255, 255, 255, 0.05)' },
  { id: 'blue', name: 'Ocean Blue', hex: '#3b82f6', tint: 'rgba(59, 130, 246, 0.22)', darkTint: 'rgba(59, 130, 246, 0.32)' },
  { id: 'purple', name: 'Royal Purple', hex: '#8b5cf6', tint: 'rgba(139, 92, 246, 0.22)', darkTint: 'rgba(139, 92, 246, 0.32)' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981', tint: 'rgba(16, 185, 129, 0.22)', darkTint: 'rgba(16, 185, 129, 0.32)' },
  { id: 'amber', name: 'Warm Amber', hex: '#f59e0b', tint: 'rgba(245, 158, 11, 0.22)', darkTint: 'rgba(245, 158, 11, 0.32)' },
  { id: 'rose', name: 'Rose Red', hex: '#f43f5e', tint: 'rgba(244, 63, 94, 0.22)', darkTint: 'rgba(244, 63, 94, 0.32)' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#6366f1', tint: 'rgba(99, 102, 241, 0.22)', darkTint: 'rgba(99, 102, 241, 0.32)' },
  { id: 'teal', name: 'Teal Cyan', hex: '#14b8a6', tint: 'rgba(20, 184, 166, 0.22)', darkTint: 'rgba(20, 184, 166, 0.32)' },
];

export interface VaultItem {
  id: string;
  title: string;
  category: ItemCategory;
  folderId: string | null;
  username?: string;
  password?: string;
  email?: string;
  website?: string;
  notes?: string;
  cardDetails?: CardInfo;
  color?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export interface FeedbackState {
  visible: boolean;
  type: 'success' | 'error' | 'delete' | 'copy';
  message: string;
}

export interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface AppContextType {
  // User Profile
  userName: string;
  userAvatar: string | null;
  updateUserProfile: (name: string, avatarUri?: string | null) => Promise<void>;

  // Security
  isInitializing: boolean;
  hasSetupPin: boolean;
  masterPin: string;
  biometricsEnabled: boolean;
  isLocked: boolean;
  hasBiometricsHardware: boolean;
  biometricsType: string;
  setupSecurity: (pin: string, enableBio: boolean, name?: string) => Promise<void>;
  unlockAppWithPin: (pin: string) => boolean;
  unlockAppWithBiometrics: () => Promise<boolean>;
  lockApp: () => void;
  updateSecuritySettings: (newPin?: string, enableBio?: boolean) => Promise<void>;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ColorsType;

  // Folder Engine
  folders: Folder[];
  currentFolderId: string | null;
  setCurrentFolderId: (folderId: string | null) => void;
  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<Folder>;
  updateFolder: (id: string, name: string, color?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFolderPath: (folderId: string | null) => BreadcrumbItem[];

  // Vault Items
  items: VaultItem[];
  addItem: (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VaultItem>;
  updateItem: (id: string, itemData: Partial<VaultItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  moveItemToFolder: (itemId: string, targetFolderId: string | null) => Promise<void>;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (filter: string) => void;

  // Modals & Overlays
  feedback: FeedbackState;
  showFeedback: (type: 'success' | 'error' | 'delete' | 'copy', message: string) => void;
  hideFeedback: () => void;

  confirmModal: ConfirmState;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    isDestructive?: boolean
  ) => void;
  hideConfirm: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Default Folders (Clean empty vault)
const DEFAULT_FOLDERS: Folder[] = [];

// Starter Vault Items
const DEFAULT_ITEMS: VaultItem[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialization state
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // User Profile state (Max 6 chars)
  const [userName, setUserName] = useState<string>('Rob');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Security state
  const [hasSetupPin, setHasSetupPin] = useState<boolean>(false);
  const [masterPin, setMasterPin] = useState<string>('');
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [hasBiometricsHardware, setHasBiometricsHardware] = useState<boolean>(false);
  const [biometricsType, setBiometricsType] = useState<string>('Biometrics');

  // Theme state (White is the primary main color)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Drive Folder & Vault Items state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Feedback Toast state
  const [feedback, setFeedback] = useState<FeedbackState>({
    visible: false,
    type: 'success',
    message: '',
  });

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const colors = isDarkMode ? darkColors : lightColors;

  // -------------------------------------------------------------
  // Helpers for Secure Storage
  // -------------------------------------------------------------
  const saveSecure = async (key: string, value: string) => {
    try {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(`@secure_${key}`, value);
      }
    } catch {
      await AsyncStorage.setItem(`@secure_${key}`, value);
    }
  };

  const getSecure = async (key: string): Promise<string | null> => {
    try {
      if (await SecureStore.isAvailableAsync()) {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) return val;
      }
      return await AsyncStorage.getItem(`@secure_${key}`);
    } catch {
      return await AsyncStorage.getItem(`@secure_${key}`);
    }
  };

  // -------------------------------------------------------------
  // Initialization & Hardware Check
  // -------------------------------------------------------------
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Check Hardware Biometrics capability
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometricsHardware(hasHardware && isEnrolled);

        if (hasHardware) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricsType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricsType('Touch ID / Fingerprint');
          }
        }

        // 2. Load Theme
        const storedTheme = await AsyncStorage.getItem('@klefkey_theme');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        }

        // 3. Load User Profile
        const storedName = await AsyncStorage.getItem('@klefkey_username');
        if (storedName) setUserName(storedName.slice(0, 6));

        const storedAvatar = await AsyncStorage.getItem('@klefkey_avatar');
        if (storedAvatar) setUserAvatar(storedAvatar);

        // 4. Load Security Settings
        const storedPin = await getSecure('klefkey_master_pin');
        const storedBio = await getSecure('klefkey_bio_enabled');

        if (storedPin) {
          setHasSetupPin(true);
          setMasterPin(storedPin);
          setBiometricsEnabled(storedBio === 'true');
          setIsLocked(true);
        } else {
          setHasSetupPin(false);
          setIsLocked(false);
        }

        // 5. Load Folders
        const storedFolders = await AsyncStorage.getItem('@klefkey_folders');
        if (storedFolders) {
          setFolders(JSON.parse(storedFolders));
        } else {
          setFolders(DEFAULT_FOLDERS);
          await AsyncStorage.setItem('@klefkey_folders', JSON.stringify(DEFAULT_FOLDERS));
        }

        // 6. Load Vault Items
        const storedItems = await AsyncStorage.getItem('@klefkey_items');
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        } else {
          setItems(DEFAULT_ITEMS);
          await AsyncStorage.setItem('@klefkey_items', JSON.stringify(DEFAULT_ITEMS));
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  // -------------------------------------------------------------
  // Profile Handlers
  // -------------------------------------------------------------
  const updateUserProfile = async (name: string, avatarUri?: string | null) => {
    const trimmed = name.trim().slice(0, 6);
    if (trimmed !== '') {
      setUserName(trimmed);
      await AsyncStorage.setItem('@klefkey_username', trimmed);
    }
    if (avatarUri !== undefined) {
      setUserAvatar(avatarUri);
      if (avatarUri) {
        await AsyncStorage.setItem('@klefkey_avatar', avatarUri);
      } else {
        await AsyncStorage.removeItem('@klefkey_avatar');
      }
    }
    showFeedback('success', 'Profile Updated!');
  };

  // -------------------------------------------------------------
  // Security Handlers
  // -------------------------------------------------------------
  const setupSecurity = async (pin: string, enableBio: boolean, name?: string) => {
    if (name) {
      const trimmed = name.trim().slice(0, 6);
      setUserName(trimmed);
      await AsyncStorage.setItem('@klefkey_username', trimmed);
    }
    setMasterPin(pin);
    setHasSetupPin(true);
    setBiometricsEnabled(enableBio);
    setIsLocked(false);

    await saveSecure('klefkey_master_pin', pin);
    await saveSecure('klefkey_bio_enabled', enableBio ? 'true' : 'false');
    showFeedback('success', 'Security PIN & Biometrics Configured!');
  };

  const unlockAppWithPin = (pin: string): boolean => {
    if (pin === masterPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const unlockAppWithBiometrics = async (): Promise<boolean> => {
    if (!biometricsEnabled) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Klefkey Vault',
        fallbackLabel: 'Use Master PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
    } catch (err) {
      console.log('Biometric auth failed or canceled:', err);
    }
    return false;
  };

  const lockApp = () => {
    if (hasSetupPin) {
      setIsLocked(true);
      showFeedback('copy', 'Vault Locked');
    }
  };

  const updateSecuritySettings = async (newPin?: string, enableBio?: boolean) => {
    if (newPin !== undefined) {
      setMasterPin(newPin);
      await saveSecure('klefkey_master_pin', newPin);
    }
    if (enableBio !== undefined) {
      setBiometricsEnabled(enableBio);
      await saveSecure('klefkey_bio_enabled', enableBio ? 'true' : 'false');
    }
    showFeedback('success', 'Security Settings Updated');
  };

  // -------------------------------------------------------------
  // Theme Toggle
  // -------------------------------------------------------------
  const toggleDarkMode = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    await AsyncStorage.setItem('@klefkey_theme', nextMode ? 'dark' : 'light');
  };

  // -------------------------------------------------------------
  // Folder Engine (Google Drive Style)
  // -------------------------------------------------------------
  const createFolder = async (
    name: string,
    parentId: string | null = currentFolderId,
    color?: string
  ): Promise<Folder> => {
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name: name.trim(),
      parentId: parentId,
      icon: 'folder',
      color: color || 'default',
      createdAt: new Date().toISOString(),
    };

    const updated = [newFolder, ...folders];
    setFolders(updated);
    await AsyncStorage.setItem('@klefkey_folders', JSON.stringify(updated));
    showFeedback('success', `Folder "${newFolder.name}" Created`);
    return newFolder;
  };

  const updateFolder = async (id: string, name: string, color?: string) => {
    const updated = folders.map((f) =>
      f.id === id ? { ...f, name: name.trim(), color: color !== undefined ? color : f.color } : f
    );
    setFolders(updated);
    await AsyncStorage.setItem('@klefkey_folders', JSON.stringify(updated));
    showFeedback('success', 'Folder Updated');
  };

  const deleteFolder = async (id: string) => {
    // Delete folder, subfolders, and move contained items to root or delete
    const folderIdsToDelete = new Set<string>([id]);

    // Find all recursive subfolder IDs
    let added = true;
    while (added) {
      added = false;
      folders.forEach((f) => {
        if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id);
          added = true;
        }
      });
    }

    const updatedFolders = folders.filter((f) => !folderIdsToDelete.has(f.id));
    // Move items inside deleted folders to root (null)
    const updatedItems = items.map((item) =>
      item.folderId && folderIdsToDelete.has(item.folderId) ? { ...item, folderId: null } : item
    );

    setFolders(updatedFolders);
    setItems(updatedItems);
    await AsyncStorage.setItem('@klefkey_folders', JSON.stringify(updatedFolders));
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updatedItems));

    if (currentFolderId && folderIdsToDelete.has(currentFolderId)) {
      setCurrentFolderId(null);
    }
    showFeedback('delete', 'Folder Removed (Items moved to Vault)');
  };

  const getFolderPath = (folderId: string | null): BreadcrumbItem[] => {
    const path: BreadcrumbItem[] = [{ id: null, name: 'Vault' }];
    if (!folderId) return path;

    const chain: BreadcrumbItem[] = [];
    let currId: string | null = folderId;

    while (currId) {
      const found = folders.find((f) => f.id === currId);
      if (found) {
        chain.unshift({ id: found.id, name: found.name });
        currId = found.parentId;
      } else {
        break;
      }
    }

    return [...path, ...chain];
  };

  // -------------------------------------------------------------
  // Vault Items CRUD
  // -------------------------------------------------------------
  const addItem = async (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<VaultItem> => {
    const newItem: VaultItem = {
      ...itemData,
      id: `item_${Date.now()}`,
      folderId: itemData.folderId !== undefined ? itemData.folderId : currentFolderId,
      color: itemData.color || 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updated));
    showFeedback('success', `Saved "${newItem.title}"`);
    return newItem;
  };

  const updateItem = async (id: string, itemData: Partial<VaultItem>) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...itemData, updatedAt: new Date().toISOString() } : item
    );
    setItems(updated);
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updated));
    showFeedback('success', 'Item Updated');
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updated));
    showFeedback('delete', 'Item Deleted');
  };

  const toggleFavorite = async (id: string) => {
    const updated = items.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
    setItems(updated);
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updated));
    const target = updated.find((i) => i.id === id);
    showFeedback('success', target?.isFavorite ? 'Added to Favorites' : 'Removed from Favorites');
  };

  const moveItemToFolder = async (itemId: string, targetFolderId: string | null) => {
    const updated = items.map((item) => (item.id === itemId ? { ...item, folderId: targetFolderId } : item));
    setItems(updated);
    await AsyncStorage.setItem('@klefkey_items', JSON.stringify(updated));
    showFeedback('success', 'Item Moved');
  };

  // -------------------------------------------------------------
  // Modals & Overlays Handlers
  // -------------------------------------------------------------
  const showFeedback = (type: 'success' | 'error' | 'delete' | 'copy', message: string) => {
    setFeedback({ visible: true, type, message });
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirm',
    isDestructive: boolean = true
  ) => {
    setConfirmModal({
      visible: true,
      title,
      message,
      confirmText,
      isDestructive,
      onConfirm: () => {
        onConfirm();
        hideConfirm();
      },
    });
  };

  const hideConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, visible: false }));
  };

  return (
    <AppContext.Provider
      value={{
        userName,
        userAvatar,
        updateUserProfile,

        isInitializing,
        hasSetupPin,
        masterPin,
        biometricsEnabled,
        isLocked,
        hasBiometricsHardware,
        biometricsType,
        setupSecurity,
        unlockAppWithPin,
        unlockAppWithBiometrics,
        lockApp,
        updateSecuritySettings,

        isDarkMode,
        toggleDarkMode,
        colors,

        folders,
        currentFolderId,
        setCurrentFolderId,
        createFolder,
        updateFolder,
        deleteFolder,
        getFolderPath,

        items,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        moveItemToFolder,

        searchQuery,
        setSearchQuery,
        selectedCategoryFilter,
        setSelectedCategoryFilter,

        feedback,
        showFeedback,
        hideFeedback,

        confirmModal,
        showConfirm,
        hideConfirm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
