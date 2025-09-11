import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ScrollView, StyleSheet } from "react-native";

export default function LogsScreen() {
  const logs = [
    "Appointment booked",
    "Email summarized",
    "Email sent to Romil",
    "Replied to Hasit",
    "Follow-up reminder scheduled",
    "Meeting notes generated",
    "Invoice drafted",
    "Contact added to CRM",
    "Support ticket updated",
    "Newsletter queued",
  ];
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
          <ScrollView contentContainerStyle={styles.logList} showsVerticalScrollIndicator={false}>
            {logs.map((message, index) => (
              <ThemedView key={`${index}-${message}`} variant="surface" style={styles.logTile}>
                <ThemedText type="defaultSemiBold" style={styles.logTitle}>{message}</ThemedText>
                <ThemedText variant="tertiary" type="caption">Just now</ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
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
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  logList: {
    paddingVertical: 4,
  },
  logTile: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.0,
    elevation: 2,
  },
  logTitle: {
    marginBottom: 6,
  },
});
