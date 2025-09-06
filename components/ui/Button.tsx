import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  gradientColors = ['#3B82F6', '#1D4ED8'],
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    style,
  ];

  const textStyleCombined = [
    styles.buttonText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[buttonStyle, { opacity: disabled || loading ? 0.7 : 1 }]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        <LinearGradient
          colors={gradientColors as any}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={textStyleCombined}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'text' ? '#3B82F6' : '#FFFFFF'} 
          size="small" 
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  primaryButton: {
    marginBottom: 24,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Sizes
  smallButton: {
    paddingVertical: 8,
  },
  mediumButton: {
    paddingVertical: 16,
  },
  largeButton: {
    paddingVertical: 20,
  },
  
  // States
  disabledButton: {
    opacity: 0.5,
  },
  
  // Text styles
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#374151',
  },
  textText: {
    color: '#3B82F6',
  },
  
  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  disabledText: {
    opacity: 0.6,
  },
});
