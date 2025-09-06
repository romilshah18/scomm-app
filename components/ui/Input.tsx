import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "./IconSymbol";

interface InputProps extends TextInputProps {
  label: string;
  icon?: "envelope" | "lock" | "person";
  error?: string;
  rightIcon?: "eye" | "eye.slash";
  onRightIconPress?: () => void;
  containerStyle?: any;
}

export function Input({
  label,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <Text style={[styles.inputLabel, { color: "#1F2937" }]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: "#FFFFFF",
            borderColor: error ? "#EF4444" : "#E5E7EB",
            borderWidth: 2,
          },
        ]}
      >
        {icon && <IconSymbol name={icon} size={20} color="#6B7280" />}
        <TextInput
          style={[styles.textInput, { color: "#1F2937" }, style]}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
          >
            <IconSymbol name={rightIcon} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  rightIconButton: {
    padding: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});
