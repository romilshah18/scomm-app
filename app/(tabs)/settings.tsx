import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColors } from "@/hooks/useThemeColor";
import { router } from "expo-router";
import { StyleSheet, Switch, TouchableOpacity } from "react-native";

export default function SettingsScreen() {
  const colors = useThemeColors();

  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          Configure your application preferences and settings.
        </ThemedText>

        <ThemedView style={styles.settingsList}>
          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="bell.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            </ThemedView>
            <Switch
              value={true}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="lock.fill" size={20} color={colors.icon} />
              <ThemedText style={styles.settingLabel}>Privacy</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </ThemedView>

          <ThemedView style={styles.settingItem}>
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="gear" size={20} color={colors.icon} />
              <ThemedText style={styles.settingLabel}>General</ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </ThemedView>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/connect-services")}
          >
            <ThemedView style={styles.settingLeft}>
              <IconSymbol name="link" size={20} color={colors.icon} />
              <ThemedText style={styles.settingLabel}>
                Connect Services
              </ThemedText>
            </ThemedView>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "left",
    marginBottom: 20,
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
});
