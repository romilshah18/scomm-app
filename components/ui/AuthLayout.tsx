import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  gradientColors?: string[];
}

export function AuthLayout({
  children,
  title,
  subtitle,
  gradientColors,
}: AuthLayoutProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const defaultGradientColors =
    colorScheme === "dark"
      ? (["#1F2937", "#111827", "#0F172A"] as const)
      : (["#3B82F6", "#1D4ED8", "#1E40AF"] as const);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={(gradientColors || defaultGradientColors) as any}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <Text style={styles.welcomeText}>{title}</Text>
                <Text style={styles.subtitleText}>{subtitle}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, { backgroundColor: "#FFFFFF" }]}>
            <View style={styles.formContainer}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    height: 200,
  },
  headerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formSection: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  formContainer: {
    flex: 1,
  },
});
