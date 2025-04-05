import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import Toast from 'react-native-toast-message';
import PaymentForm from './components/PaymentForm';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PaymentForm />
      <StatusBar style="auto" />
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
});
