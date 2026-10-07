import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { THEME } from "../constants";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText: string;
  confirmColor?: string;
  secondAction?: () => void;
  secondActionText?: string;
}

export const CustomModal = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText,
  confirmColor,
  secondAction,
  secondActionText,
}: CustomModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalBtn} onPress={onCancel}>
            <Text style={styles.modalBtnText}>Cancel</Text>
          </TouchableOpacity>
          {secondAction && secondActionText && (
            <TouchableOpacity style={styles.modalBtn} onPress={secondAction}>
              <Text style={[styles.modalBtnText, { color: THEME.danger }]}>
                {secondActionText}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.modalBtnMain,
              { backgroundColor: confirmColor || THEME.primary },
            ]}
            onPress={onConfirm}
          >
            <Text style={styles.modalBtnMainText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 25,
    width: "100%",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  modalMessage: {
    color: THEME.textDim,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBtn: { paddingHorizontal: 15, paddingVertical: 10, marginLeft: 10 },
  modalBtnText: { color: THEME.textDim, fontWeight: "700", fontSize: 15 },
  modalBtnMain: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  modalBtnMainText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
