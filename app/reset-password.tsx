import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { AuthLayout } from '@/components/ui/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

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
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!requirements.hasUppercase || !requirements.hasLowercase) {
      setPasswordError('Password must contain both uppercase and lowercase letters');
      return false;
    }
    if (!requirements.hasNumber) {
      setPasswordError('Password must contain at least 1 number');
      return false;
    }
    if (!requirements.hasSpecialChar) {
      setPasswordError('Password must contain at least 1 special character');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (text: string) => {
    if (text !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleResetPassword = async () => {
    // Clear previous errors
    setPasswordError('');
    setConfirmPasswordError('');

    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success!', 
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    }, 2000);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a new secure password"
    >
      {/* Password Input */}
      <Input
        label="New Password"
        icon="lock"
        placeholder="Enter your new password"
        value={password}
        onChangeText={setPassword}
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
        label="Confirm New Password"
        icon="lock"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!isConfirmPasswordVisible}
        autoCapitalize="none"
        autoCorrect={false}
        rightIcon={isConfirmPasswordVisible ? "eye.slash" : "eye"}
        onRightIconPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
        error={confirmPasswordError}
      />

      {/* Reset Password Button */}
      <Button
        title={isLoading ? 'Resetting Password...' : 'Reset Password'}
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={isLoading || !password.trim() || !confirmPassword.trim()}
      />

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Text style={styles.securityText}>
          🔒 Your password is encrypted and secure. Make sure to use a strong, unique password.
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  securityNote: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  securityText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    textAlign: 'center',
  },
});
