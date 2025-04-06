import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';
import { FinancialProvider } from './context/FinancialContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <FinancialProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <Toast />
      </FinancialProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
});
