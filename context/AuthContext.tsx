import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Ensure the native Google Sign-In is configured
GoogleSignin.configure({
  // You would need to get a webClientId from Google Cloud Console
  webClientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your actual client ID when you have it
});

// Register for the authentication callback
WebBrowser.maybeCompleteAuthSession();

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key
const USER_STORAGE_KEY = 'mindfulpay_user';

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your actual client ID when you have it
    iosClientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your actual client ID when you have it
    androidClientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your actual client ID when you have it
    webClientId: '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com', // Replace with your actual client ID when you have it
    scopes: ['profile', 'email']
  });

  // Load user data from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  // Load user from AsyncStorage
  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save user to AsyncStorage
  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Fetch user info using the access token
  const fetchUserInfo = async (accessToken: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await response.json();
      
      const userData: User = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        photoUrl: userInfo.picture,
      };

      setUser(userData);
      await saveUser(userData);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      // Clear user data from state and storage
      setUser(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Sign out from Google
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};