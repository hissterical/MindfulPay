import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TransactionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.subtitle}>Your transaction history will appear here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default TransactionsScreen;