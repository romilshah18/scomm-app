import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColors } from "@/hooks/useThemeColor";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  iconType: "FontAwesome" | "MaterialIcons";
  color: string;
  gradientColors: string[];
  connected: boolean;
}

export default function ConnectServicesScreen() {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: "google",
      name: "Google",
      description: "",
      iconName: "google",
      iconType: "FontAwesome",
      color: "#4285F4",
      gradientColors: ["#667eea", "#764ba2"],
      connected: false,
    },
    {
      id: "outlook",
      name: "Outlook",
      description: "",
      iconName: "mail",
      iconType: "MaterialIcons",
      color: "#0078D4",
      gradientColors: ["#667eea", "#764ba2"],
      connected: false,
    },
    {
      id: "calendar",
      name: "Calendar",
      description: "",
      iconName: "event",
      iconType: "MaterialIcons",
      color: "#007AFF",
      gradientColors: ["#667eea", "#764ba2"],
      connected: false,
    },
  ]);

  const handleServiceToggle = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, connected: !service.connected }
          : service
      )
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Simple Header */}
      <ThemedView
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          Connect Services
        </ThemedText>

        <ThemedView style={styles.headerSpacer} />
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView
          style={[styles.card, { backgroundColor: colors.background }]}
        >
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Integrate Your Accounts
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.text }]}>
            Connect your favorite services to enhance your voice assistant
            experience
          </ThemedText>

          <ThemedView style={styles.servicesList}>
            {services.map((service) => (
              <LinearGradient
                key={service.id}
                colors={service.gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.serviceItem}
              >
                <View style={styles.serviceLeft}>
                  <View style={styles.serviceIcon}>
                    {service.iconType === "FontAwesome" ? (
                      <FontAwesome
                        name={service.iconName as any}
                        size={28}
                        color="#ffffff"
                      />
                    ) : (
                      <MaterialIcons
                        name={service.iconName as any}
                        size={28}
                        color="#ffffff"
                      />
                    )}
                  </View>
                  <ThemedText style={styles.serviceName}>
                    {service.name}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    {
                      backgroundColor: service.connected
                        ? "#10b981"
                        : "#667eea",
                    },
                  ]}
                  onPress={() => handleServiceToggle(service.id)}
                >
                  <ThemedText style={styles.connectButtonText}>
                    {service.connected ? "Connected" : "Connect"}
                  </ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            ))}
          </ThemedView>

          <ThemedView
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? "#1e293b" : "#f0f9ff",
                borderColor: isDark ? "#334155" : "#e0f2fe",
              },
            ]}
          >
            <IconSymbol name="info.circle" size={20} color={colors.primary} />
            <ThemedText
              style={[
                styles.infoText,
                { color: isDark ? "#94a3b8" : "#0369a1" },
              ]}
            >
              Connected services will be available in your voice assistant
              conversations. You can manage permissions and disconnect services
              at any time.
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  servicesList: {
    gap: 16,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 80,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#374151",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    flexShrink: 1,
    color: "#ffffff",
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});
