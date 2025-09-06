import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LinkTextProps {
  text: string;
  linkText: string;
  onPress: () => void;
  containerStyle?: any;
}

export function LinkText({ text, linkText, onPress, containerStyle }: LinkTextProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, { color: '#6B7280' }]}>
        {text}{' '}
      </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.link, { color: '#3B82F6' }]}>
          {linkText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});
