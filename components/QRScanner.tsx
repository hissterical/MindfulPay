import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
} from "react-native";
import { RNCamera } from "react-native-camera";
import { launchUpiPayment } from "../utils/upiLauncher";
import Toast from "react-native-toast-message";
import { checkVendorBlocklist } from "../utils/vendorCheck";
import { checkSpendingLimit } from "../utils/spendingLimit";

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess?: (upiId: string) => void;
}

interface BlockedPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onEmergencyOverride: () => void;
  message: string;
  reason: "blacklist" | "limit";
}

const BlockedPaymentModal: React.FC<BlockedPaymentModalProps> = ({
  visible,
  onClose,
  onEmergencyOverride,
  message,
  reason,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {reason === "blacklist"
              ? "Blocked Vendor"
              : "Spending Limit Reached"}
          </Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.emergencyButton]}
              onPress={onEmergencyOverride}
            >
              <Text style={styles.buttonText}>Emergency Override</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [blockedReason, setBlockedReason] = useState<"blacklist" | "limit">(
    "blacklist"
  );
  const [currentUpiData, setCurrentUpiData] = useState<any>(null);
  const cameraRef = useRef<RNCamera>(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission to scan QR codes",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Camera permission error:", error);
      setCameraError("Failed to initialize camera");
      setHasPermission(false);
    }
  };

  const parseUpiQrData = (data: string) => {
    try {
      // UPI QR codes typically have format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
      const url = new URL(data);
      const params = new URLSearchParams(url.search);

      return {
        upiId: params.get("pa") || "",
        name: params.get("pn") || "",
        amount: params.get("am") ? parseFloat(params.get("am") || "0") : 0,
        note: params.get("tn") || "Payment via QR code",
      };
    } catch (error) {
      console.error("Error parsing UPI QR data:", error);
      return null;
    }
  };

  const handleBlockedPayment = (
    upiData: any,
    reason: "blacklist" | "limit"
  ) => {
    setCurrentUpiData(upiData);
    setBlockedReason(reason);
    setBlockedMessage(
      reason === "blacklist"
        ? `Payments to ${upiData.upiId} are blocked due to security concerns.`
        : "You have reached your monthly spending limit. Emergency override available."
    );
    setBlockedModalVisible(true);
  };

  const handleEmergencyOverride = async () => {
    setBlockedModalVisible(false);
    setIsLoading(true);

    try {
      // Confirm emergency override
      Alert.alert(
        "Emergency Override",
        "Are you sure you want to proceed with this payment? This action will be logged.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setIsLoading(false);
              setScanned(false);
            },
          },
          {
            text: "Proceed",
            onPress: async () => {
              const success = await launchUpiPayment(
                currentUpiData.upiId,
                currentUpiData.amount || 0,
                currentUpiData.note
              );

              if (success) {
                Toast.show({
                  type: "success",
                  text1: "Payment Initiated",
                  text2: "UPI payment app launched successfully",
                });
                onClose();
              }
              setIsLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "Could not process UPI payment",
      });
      console.error("Emergency payment error:", error);
      setIsLoading(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    // Check if it's a UPI QR code
    if (!data.startsWith("upi://")) {
      Toast.show({
        type: "error",
        text1: "Invalid QR Code",
        text2: "This is not a valid UPI QR code",
      });
      return;
    }

    const upiData = parseUpiQrData(data);

    if (!upiData) {
      Toast.show({
        type: "error",
        text1: "Invalid QR Code",
        text2: "Could not parse UPI QR code data",
      });
      return;
    }

    // If onScanSuccess is provided and we just want to extract the UPI ID
    if (onScanSuccess) {
      Toast.show({
        type: "success",
        text1: "QR Code Scanned",
        text2: `UPI ID: ${upiData.upiId} detected`,
      });
      onScanSuccess(upiData.upiId);
      return;
    }

    setIsLoading(true);

    try {
      // Check vendor blocklist
      const isBlocked = await checkVendorBlocklist(upiData.upiId);
      if (isBlocked) {
        handleBlockedPayment(upiData, "blacklist");
        setIsLoading(false);
        return;
      }

      // Check spending limit if amount is provided in QR
      if (upiData.amount > 0) {
        const isWithinLimit = await checkSpendingLimit(upiData.amount);
        if (!isWithinLimit) {
          handleBlockedPayment(upiData, "limit");
          setIsLoading(false);
          return;
        }
      }

      // If all checks pass, proceed with normal payment
      Alert.alert(
        "Confirm Payment",
        `Pay ₹${upiData.amount || "Not specified"} to ${
          upiData.name || upiData.upiId
        }?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setIsLoading(false);
              setScanned(false);
            },
          },
          {
            text: "Pay",
            onPress: async () => {
              const success = await launchUpiPayment(
                upiData.upiId,
                upiData.amount || 0,
                upiData.note
              );

              if (success) {
                Toast.show({
                  type: "success",
                  text1: "Payment Initiated",
                  text2: "UPI payment app launched successfully",
                });
                onClose();
              }
              setIsLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "Could not process UPI payment",
      });
      console.error("QR payment error:", error);
      setIsLoading(false);
      setScanned(false);
    }
  };

  if (cameraError) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{cameraError}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
        androidCameraPermissionOptions={{
          title: "Permission to use camera",
          message:
            "We need your permission to use your camera to scan QR codes",
          buttonPositive: "OK",
          buttonNegative: "Cancel",
        }}
        onBarCodeRead={scanned ? undefined : handleBarCodeScanned}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        onMountError={(error) => {
          console.error("Camera mount error:", error);
          setCameraError("Failed to initialize camera");
        }}
      />

      {scanned && !isLoading && (
        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.overlay}>
        <View style={styles.scanWindow} />
        <Text style={styles.instructions}>Align QR code within the frame</Text>
      </View>

      <BlockedPaymentModal
        visible={blockedModalVisible}
        onClose={() => {
          setBlockedModalVisible(false);
          setScanned(false);
        }}
        onEmergencyOverride={handleEmergencyOverride}
        message={blockedMessage}
        reason={blockedReason}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanAgainButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#2E7D32",
    padding: 15,
    borderRadius: 8,
    width: 150,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanWindow: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#2E7D32",
    backgroundColor: "transparent",
  },
  instructions: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
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
});

export default QRScanner;
