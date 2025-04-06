/**
 * Utility to check if a UPI ID is in the blocklist
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Empty initial blocklist - users will add their own
const BLACKLISTED_UPI_IDS: string[] = [];

const BLOCKLIST_STORAGE_KEY = 'mindfulpay_blocklist';

// Initialize blocklist in AsyncStorage if not exists
export const initializeBlocklist = async () => {
  try {
    const existingBlocklist = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
    if (!existingBlocklist) {
      await AsyncStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(BLACKLISTED_UPI_IDS));
    }
  } catch (error) {
    console.error('Error initializing blocklist:', error);
  }
};

/**
 * Checks if a UPI ID is in the blocklist
 * @param upiId The UPI ID to check
 * @returns true if the UPI ID is blocked, false otherwise
 */
export const checkVendorBlocklist = async (upiId: string): Promise<boolean> => {
  try {
    const blocklist = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
    if (!blocklist) {
      await initializeBlocklist();
      return false;
    }
    const blockedIds = JSON.parse(blocklist);
    return blockedIds.includes(upiId.toLowerCase());
  } catch (error) {
    console.error('Error checking vendor blocklist:', error);
    return false;
  }
};

export const addToBlocklist = async (upiId: string) => {
  try {
    const blocklist = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
    const blockedIds = blocklist ? JSON.parse(blocklist) : [];
    if (!blockedIds.includes(upiId.toLowerCase())) {
      blockedIds.push(upiId.toLowerCase());
      await AsyncStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(blockedIds));
    }
  } catch (error) {
    console.error('Error adding to blocklist:', error);
  }
};

export const removeFromBlocklist = async (upiId: string) => {
  try {
    const blocklist = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
    if (blocklist) {
      const blockedIds = JSON.parse(blocklist);
      const updatedIds = blockedIds.filter((id: string) => id !== upiId.toLowerCase());
      await AsyncStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(updatedIds));
    }
  } catch (error) {
    console.error('Error removing from blocklist:', error);
  }
};

export const getBlocklist = async (): Promise<string[]> => {
  try {
    const blocklist = await AsyncStorage.getItem(BLOCKLIST_STORAGE_KEY);
    return blocklist ? JSON.parse(blocklist) : [];
  } catch (error) {
    console.error('Error getting blocklist:', error);
    return [];
  }
};