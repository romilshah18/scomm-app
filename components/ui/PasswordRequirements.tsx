import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface PasswordRequirementsProps {
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function PasswordRequirements({ requirements }: PasswordRequirementsProps) {
  return (
    <View style={styles.requirementsContainer}>
      <Text style={styles.requirementsTitle}>Password must contain:</Text>
      
      <View style={styles.requirementItem}>
        <IconSymbol 
          name={requirements.minLength ? "checkmark.circle.fill" : "circle"} 
          size={16} 
          color={requirements.minLength ? "#10B981" : "#9CA3AF"} 
        />
        <Text style={[
          styles.requirementText,
          { color: requirements.minLength ? "#10B981" : "#9CA3AF" }
        ]}>
          At least 8 characters
        </Text>
      </View>
      
      <View style={styles.requirementItem}>
        <IconSymbol 
          name={requirements.hasUppercase && requirements.hasLowercase ? "checkmark.circle.fill" : "circle"} 
          size={16} 
          color={requirements.hasUppercase && requirements.hasLowercase ? "#10B981" : "#9CA3AF"} 
        />
        <Text style={[
          styles.requirementText,
          { color: requirements.hasUppercase && requirements.hasLowercase ? "#10B981" : "#9CA3AF" }
        ]}>
          Uppercase and lowercase letters
        </Text>
      </View>
      
      <View style={styles.requirementItem}>
        <IconSymbol 
          name={requirements.hasNumber ? "checkmark.circle.fill" : "circle"} 
          size={16} 
          color={requirements.hasNumber ? "#10B981" : "#9CA3AF"} 
        />
        <Text style={[
          styles.requirementText,
          { color: requirements.hasNumber ? "#10B981" : "#9CA3AF" }
        ]}>
          1 number
        </Text>
      </View>
      
      <View style={styles.requirementItem}>
        <IconSymbol 
          name={requirements.hasSpecialChar ? "checkmark.circle.fill" : "circle"} 
          size={16} 
          color={requirements.hasSpecialChar ? "#10B981" : "#9CA3AF"} 
        />
        <Text style={[
          styles.requirementText,
          { color: requirements.hasSpecialChar ? "#10B981" : "#9CA3AF" }
        ]}>
          1 special character
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  requirementsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
