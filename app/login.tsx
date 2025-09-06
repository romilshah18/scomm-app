import { AuthLayout } from "@/components/ui/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkText } from "@/components/ui/LinkText";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("Test@123");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Login successful!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/webrtc-mic"),
        },
      ]);
    }, 2000);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      {/* Email Input */}
      <Input
        label="Email"
        icon="envelope"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Password Input */}
      <Input
        label="Password"
        icon="lock"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        rightIcon={isPasswordVisible ? "eye.slash" : "eye"}
        onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
      />

      {/* Forgot Password */}
      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => router.push("/forgot-password")}
      >
        <Text style={[styles.forgotPasswordText, { color: "#3B82F6" }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Login Button */}
      <Button
        title={isLoading ? "Signing In..." : "Sign In"}
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
      />

      {/* Sign Up Link */}
      <LinkText
        text="Don't have an account?"
        linkText="Sign Up"
        onPress={() => router.push("/signup")}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
