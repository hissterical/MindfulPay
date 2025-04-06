import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import PaymentForm from "../components/PaymentForm";
import QRScanner from "../components/QRScanner";
import { Ionicons } from "@expo/vector-icons";
import { checkVendorBlocklist } from "../utils/vendorCheck";
import { checkSpendingLimit } from "../utils/spendingLimit";
import { launchUpiPayment } from "../utils/upiLauncher";
import Toast from "react-native-toast-message";
import { useFinancial } from "../context/FinancialContext";
import { EXPENSE_CATEGORIES, CATEGORY_ICONS } from "../utils/categories";

const PaymentScreen: React.FC = () => {
  const { addTransaction, spendingLimits, categoryTotals } = useFinancial();
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
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  useEffect(() => {
    // Initialize blocklist when component mounts
    checkVendorBlocklist("test@upi"); // This will trigger initialization
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
    const paymentAmount = parseFloat(amount);

    try {
      await addTransaction({
        amount: paymentAmount,
        type: "expense",
        category,
        description: `EMERGENCY: UPI Payment to ${upiId}`,
        date: new Date().toISOString(),
        merchant: upiId,
      });

      // Clear the form
      setUpiId("");
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);

      Alert.alert("Success", "Emergency payment processed successfully!");
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
    amount: number
  ): Promise<boolean> => {
    try {
      // Check vendor blocklist
      const isBlocked = await checkVendorBlocklist(upiId);
      if (isBlocked) {
        handleBlockedPayment(upiId, amount, "blacklist");
        return false;
      }

      // Check spending limit
      const isWithinLimit = await checkSpendingLimit(amount);
      if (!isWithinLimit) {
        handleBlockedPayment(upiId, amount, "limit");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking payment conditions:", error);
      return false;
    }
  };

  const handlePayment = async () => {
    if (!upiId || !amount) {
      Alert.alert("Error", "Please enter both UPI ID and amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // Check if the payment would exceed the category limit
    const categoryLimit = spendingLimits.find(
      (limit) => limit.category === category && limit.period === "monthly"
    );

    if (categoryLimit) {
      const currentSpent = categoryTotals[category] || 0;
      if (currentSpent + paymentAmount > categoryLimit.amount) {
        setBlockedMessage(
          `This payment would exceed your monthly limit of ₹${categoryLimit.amount} for ${category}`
        );
        setBlockedReason("limit");
        setBlockedModalVisible(true);
        return;
      }
    }

    try {
      // Add the transaction first
      await addTransaction({
        amount: paymentAmount,
        type: "expense",
        category,
        description: `UPI Payment to ${upiId}`,
        date: new Date().toISOString(),
        merchant: upiId,
      });

      // Launch UPI payment
      const success = await launchUpiPayment(
        upiId,
        paymentAmount,
        `Payment for ${category}`
      );

      if (success) {
        // Clear the form
        setUpiId("");
        setAmount("");
        setCategory(EXPENSE_CATEGORIES[0]);
        Toast.show({
          type: "success",
          text1: "Payment Successful",
          text2: `₹${paymentAmount} paid to ${upiId}`,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Payment Failed",
          text2: "Please try again",
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
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
          <ScrollView style={styles.categoryScrollView}>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.activeCategoryButton,
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategorySelector(false);
                  }}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[cat] as any}
                    size={24}
                    color={category === cat ? "#fff" : "#2E7D32"}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.activeCategoryText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
        upiId={scannedUpiId}
        onPaymentAttempt={handlePaymentAttempt}
      />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <Ionicons name="qr-code-outline" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>

      {/* Category Selection Button */}
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
  },
  activeCategoryButton: {
    backgroundColor: "#2E7D32",
  },
  activeCategoryText: {
    color: "white",
  },
});

export default PaymentScreen;
