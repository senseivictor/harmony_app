import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../constants";

interface InputModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (text: string) => void;
  confirmText: string;
}

export const InputModal = ({
  visible,
  title,
  placeholder,
  onCancel,
  onConfirm,
  confirmText,
}: InputModalProps) => {
  const [text, setText] = useState("");

  const handleConfirm = () => {
    onConfirm(text);
    setText("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={THEME.textDim}
            value={text}
            onChangeText={setText}
            autoFocus
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onCancel}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btnMain,
                { opacity: text.trim().length === 0 ? 0.5 : 1 },
              ]}
              disabled={text.trim().length === 0}
              onPress={handleConfirm}
            >
              <Text style={styles.btnMainText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  content: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 25,
    width: "100%",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 15,
  },
  input: {
    backgroundColor: THEME.bg,
    color: THEME.text,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  btn: { paddingHorizontal: 15, paddingVertical: 10, marginLeft: 10 },
  btnText: { color: THEME.textDim, fontWeight: "700", fontSize: 15 },
  btnMain: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  btnMainText: { color: "#000", fontWeight: "800", fontSize: 15 },
});
