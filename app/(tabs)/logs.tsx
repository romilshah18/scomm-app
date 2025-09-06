import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet } from "react-native";

export default function LogsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Logs
        </ThemedText>
        <ThemedText variant="secondary" style={styles.subtitle}>
          View and manage your application logs here.
        </ThemedText>
        <ThemedView variant="backgroundSecondary" style={styles.logContainer}>
          <ThemedText variant="tertiary" type="caption">
            No logs available
          </ThemedText>
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
  logContainer: {
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
