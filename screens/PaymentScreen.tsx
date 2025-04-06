import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  TextInput,
  ScrollView,
  Keyboard,
} from "react-native";
import PaymentForm, { PaymentFormRef } from "../components/PaymentForm";
import QRScanner from "../components/QRScanner";
import { Ionicons } from "@expo/vector-icons";
import { checkVendorBlocklist } from "../utils/vendorCheck";
import { checkSpendingLimit } from "../utils/spendingLimit";
import { launchUpiPayment } from "../utils/upiLauncher";
import Toast from "react-native-toast-message";
import { useFinancial } from "../context/FinancialContext";
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from "../utils/categories";

const PaymentScreen: React.FC = () => {
  const { addTransaction, spendingLimits, categoryTotals, refreshData } = useFinancial();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState("");
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [blockedReason, setBlockedReason] = useState<"blacklist" | "limit">(
    "blacklist"
  );
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Reference to PaymentForm component
  const paymentFormRef = useRef<PaymentFormRef>(null);

  useEffect(() => {
    // Initialize blocklist when component mounts
    checkVendorBlocklist("test@upi"); // This will trigger initialization
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Clean up listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBlockedPayment = (
    upiId: string,
    amount: number,
    reason: "blacklist" | "limit"
  ) => {
    setCurrentPaymentData({ upiId, amount });
    setBlockedReason(reason);
    setBlockedMessage(
      reason === "blacklist"
        ? `Payments to ${upiId} are blocked to help you control your spending.`
        : "You have reached your monthly spending limit. Emergency override available."
    );
    setBlockedModalVisible(true);
  };

  const handleEmergencyOverride = async () => {
    setBlockedModalVisible(false);
    
    if (!currentPaymentData || !currentPaymentData.upiId || !currentPaymentData.amount) {
      Toast.show({
        type: "error",
        text1: "Invalid payment data",
        text2: "Please try again"
      });
      return;
    }

    const paymentAmount = currentPaymentData.amount;
    const paymentUpiId = currentPaymentData.upiId;

    try {
      // Add an emergency transaction
      await addTransaction({
        amount: paymentAmount,
        type: "expense",
        category,
        description: `EMERGENCY: UPI Payment to ${paymentUpiId}`,
        date: new Date().toISOString().split('T')[0],
        merchant: paymentUpiId,
      });

      // Launch the UPI payment
      const success = await launchUpiPayment(
        paymentUpiId,
        paymentAmount,
        `Emergency payment for ${category}`
      );

      if (success) {
        Toast.show({
          type: "success",
          text1: "Emergency Payment Processed",
          text2: `₹${paymentAmount} paid to ${paymentUpiId}`
        });
        
        // Reset form and refresh data
        if (paymentFormRef.current) {
          paymentFormRef.current.resetForm();
        }
        setScannedUpiId("");
        await refreshData();
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: "Please try again"
        });
      }
    } catch (error) {
      console.error("Error processing emergency payment:", error);
      Alert.alert(
        "Error",
        "Failed to process emergency payment. Please try again."
      );
    }
  };

  const BlockedPaymentModal = () => (
    <Modal
      visible={blockedModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setBlockedModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {blockedReason === "blacklist"
              ? "Blocked Vendor"
              : "Spending Limit Reached"}
          </Text>
          <Text style={styles.modalMessage}>{blockedMessage}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.emergencyButton]}
              onPress={handleEmergencyOverride}
            >
              <Text style={styles.buttonText}>Emergency Override</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setBlockedModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handlePaymentAttempt = async (
    upiId: string,
    amount: number,
    noteText?: string
  ): Promise<boolean> => {
    try {
      // Save the payment details for potential transaction recording
      setUpiId(upiId);
      setAmount(amount.toString());
      setNote(noteText || "");
      
      // Check vendor blocklist
      const isBlocked = await checkVendorBlocklist(upiId);
      if (isBlocked) {
        handleBlockedPayment(upiId, amount, "blacklist");
        return false;
      }

      // Check global spending limit (handled by checkSpendingLimit utility)
      const isWithinGlobalLimit = await checkSpendingLimit(amount, category);
      if (!isWithinGlobalLimit) {
        handleBlockedPayment(upiId, amount, "limit");
        return false;
      }

      // Check category-specific limit from spendingLimits state
      const categoryLimit = spendingLimits.find(
        (limit) => limit.category === category && limit.period === "monthly"
      );

      if (categoryLimit) {
        const currentSpent = categoryTotals[category] || 0;
        const totalWithNewTransaction = currentSpent + amount;
        
        if (totalWithNewTransaction > categoryLimit.amount) {
          const remainingBudget = Math.max(0, categoryLimit.amount - currentSpent);
          
          setBlockedMessage(
            `This payment of ₹${amount} would exceed your monthly limit for ${category}.\n\n` +
            `Current spending: ₹${currentSpent}\n` +
            `Monthly limit: ₹${categoryLimit.amount}\n` +
            `Remaining budget: ₹${remainingBudget}`
          );
          setBlockedReason("limit");
          setBlockedModalVisible(true);
          return false;
        }
      }

      // If all checks pass, record the transaction
      await addTransaction({
        amount: amount,
        type: "expense",
        category,
        description: noteText ? `UPI Payment: ${noteText}` : `UPI Payment to ${upiId}`,
        date: new Date().toISOString().split('T')[0],
        merchant: upiId,
      });

      // Refresh data to update transaction lists
      await refreshData();
      
      // Return true to allow the payment to proceed
      return true;
    } catch (error) {
      console.error("Error checking payment conditions:", error);
      return false;
    }
  };

  const CategorySelectorModal = () => (
    <Modal
      visible={showCategorySelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategorySelector(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && styles.activeCategoryOption,
                ]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategorySelector(false);
                }}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat] as any}
                  size={20}
                  color={category === cat ? "#fff" : "#2E7D32"}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === cat && styles.activeCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowCategorySelector(false)}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (showScanner) {
    return (
      <QRScanner
        onClose={() => setShowScanner(false)}
        onScanSuccess={(upiId) => {
          setScannedUpiId(upiId);
          setShowScanner(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <PaymentForm
        ref={paymentFormRef}
        upiId={scannedUpiId}
        onPaymentAttempt={handlePaymentAttempt}
      />
      
      {/* Only show floating buttons when keyboard is not visible */}
      {!keyboardVisible && (
        <>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Ionicons name="qr-code-outline" size={24} color="white" />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategorySelector(true)}
          >
            <Ionicons
              name={CATEGORY_ICONS[category] as any}
              size={24}
              color="#2E7D32"
            />
            <Text style={styles.categoryButtonText}>{category}</Text>
          </TouchableOpacity>
        </>
      )}

      <BlockedPaymentModal />
      <CategorySelectorModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scanButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2E7D32",
    borderRadius: 50,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2E7D32",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: "center",
  },
  emergencyButton: {
    backgroundColor: "#D32F2F",
  },
  cancelButton: {
    backgroundColor: "#757575",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  categoryButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "white",
    borderRadius: 50,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  categoryButtonText: {
    color: "#2E7D32",
    fontWeight: "bold",
    marginLeft: 8,
  },
  categoryScrollView: {
    maxHeight: 400,
    width: "100%",
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeCategoryOption: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  categoryOptionText: {
    color: '#333',
    marginLeft: 8,
    fontSize: 14,
  },
  activeCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
