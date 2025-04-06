import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
} from "react-native";
import PaymentForm from "../components/PaymentForm";
import QRScanner from "../components/QRScanner";
import { Ionicons } from "@expo/vector-icons";
import { checkVendorBlocklist } from "../utils/vendorCheck";
import { checkSpendingLimit } from "../utils/spendingLimit";
import Toast from "react-native-toast-message";

const PaymentScreen: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState("");
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [blockedReason, setBlockedReason] = useState<"blacklist" | "limit">(
    "blacklist"
  );
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);

  const handleBlockedPayment = (
    upiId: string,
    amount: number,
    reason: "blacklist" | "limit"
  ) => {
    setCurrentPaymentData({ upiId, amount });
    setBlockedReason(reason);
    setBlockedMessage(
      reason === "blacklist"
        ? `Payments to ${upiId} are blocked due to security concerns.`
        : "You have reached your monthly spending limit. Emergency override available."
    );
    setBlockedModalVisible(true);
  };

  const handleEmergencyOverride = async () => {
    setBlockedModalVisible(false);

    try {
      // Confirm emergency override
      Alert.alert(
        "Emergency Override",
        "Are you sure you want to proceed with this payment? This action will be logged.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Proceed",
            onPress: async () => {
              // Here you would implement the actual payment logic
              Toast.show({
                type: "success",
                text1: "Payment Initiated",
                text2: "Emergency override approved",
              });
            },
          },
        ]
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "Could not process payment",
      });
      console.error("Emergency payment error:", error);
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
        onPaymentAttempt={(upiId, amount) => {
          // Check vendor blocklist
          if (checkVendorBlocklist(upiId)) {
            handleBlockedPayment(upiId, amount, "blacklist");
            return false;
          }

          // Check spending limit
          checkSpendingLimit(amount).then((isWithinLimit) => {
            if (!isWithinLimit) {
              handleBlockedPayment(upiId, amount, "limit");
              return false;
            }
            return true;
          });
        }}
      />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <Ionicons name="qr-code-outline" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>
      <BlockedPaymentModal />
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
});

export default PaymentScreen;
