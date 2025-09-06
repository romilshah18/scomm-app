import { AuthLayout } from "@/components/ui/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkText } from "@/components/ui/LinkText";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleSendResetLink = async () => {
    // Clear previous errors
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
    }, 2000);
  };

  const handleResendEmail = async () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Reset link sent again!");
    }, 1500);
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you a reset link"
      >
        {/* Success Message */}
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{" "}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.instructionText}>
            Please check your email and click the link to reset your password.
            The link will expire in 15 minutes.
          </Text>
        </View>

        {/* Resend Email Button */}
        <Button
          title={isLoading ? "Sending..." : "Resend Email"}
          onPress={handleResendEmail}
          loading={isLoading}
          disabled={isLoading}
          variant="secondary"
        />

        {/* Back to Login */}
        <LinkText
          text="Remember your password?"
          linkText="Back to Login"
          onPress={() => router.back()}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="No worries, we'll help you reset it"
    >
      {/* Email Input */}
      <Input
        label="Email Address"
        icon="envelope"
        placeholder="Enter your email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={emailError}
      />

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Enter the email address associated with your account and we'll send
          you a link to reset your password.
        </Text>
      </View>

      {/* Send Reset Link Button */}
      <Button
        title={isLoading ? "Sending Reset Link..." : "Send Reset Link"}
        onPress={handleSendResetLink}
        loading={isLoading}
        disabled={isLoading || !email.trim()}
      />

      {/* Back to Login */}
      <LinkText
        text="Remember your password?"
        linkText="Back to Login"
        onPress={() => router.back()}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  successContainer: {
    alignItems: "center",
    marginBottom: 32,
    padding: 24,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0EA5E9",
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  emailText: {
    fontWeight: "600",
    color: "#1E40AF",
  },
  instructionText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});
