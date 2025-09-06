import { AuthLayout } from "@/components/ui/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkText } from "@/components/ui/LinkText";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert } from "react-native";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const validateName = (text: string) => {
    if (text.length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(text)) {
      setNameError("Name can only contain letters and spaces");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (text: string) => {
    const requirements = {
      minLength: text.length >= 8,
      hasUppercase: /[A-Z]/.test(text),
      hasLowercase: /[a-z]/.test(text),
      hasNumber: /\d/.test(text),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(text),
    };

    setPasswordRequirements(requirements);

    if (!requirements.minLength) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (!requirements.hasUppercase || !requirements.hasLowercase) {
      setPasswordError(
        "Password must contain both uppercase and lowercase letters"
      );
      return false;
    }
    if (!requirements.hasNumber) {
      setPasswordError("Password must contain at least 1 number");
      return false;
    }
    if (!requirements.hasSpecialChar) {
      setPasswordError("Password must contain at least 1 special character");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (text: string) => {
    if (text !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  const handleSignUp = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (
      !isNameValid ||
      !isEmailValid ||
      !isPasswordValid ||
      !isConfirmPasswordValid
    ) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/webrtc-mic"),
        },
      ]);
    }, 2000);
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join us to get started">
      {/* Name Input */}
      <Input
        label="Full Name"
        icon="person"
        placeholder="Enter your full name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          validateName(text);
        }}
        autoCapitalize="words"
        autoCorrect={false}
        error={nameError}
      />

      {/* Email Input */}
      <Input
        label="Email"
        icon="envelope"
        placeholder="Enter your email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateEmail(text);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={emailError}
      />

      {/* Password Input */}
      <Input
        label="Password"
        icon="lock"
        placeholder="Create a password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validatePassword(text);
        }}
        secureTextEntry={!isPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        rightIcon={isPasswordVisible ? "eye.slash" : "eye"}
        onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
        error={passwordError}
      />

      {/* Password Requirements */}
      <PasswordRequirements requirements={passwordRequirements} />

      {/* Confirm Password Input */}
      <Input
        label="Confirm Password"
        icon="lock"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          validateConfirmPassword(text);
        }}
        secureTextEntry={!isConfirmPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        rightIcon={isConfirmPasswordVisible ? "eye.slash" : "eye"}
        onRightIconPress={() =>
          setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
        }
        error={confirmPasswordError}
      />

      {/* Sign Up Button */}
      <Button
        title={isLoading ? "Creating Account..." : "Create Account"}
        onPress={handleSignUp}
        loading={isLoading}
        disabled={isLoading}
      />

      {/* Sign In Link */}
      <LinkText
        text="Already have an account?"
        linkText="Sign In"
        onPress={() => router.back()}
      />
    </AuthLayout>
  );
}

// No custom styles needed - all handled by common components
