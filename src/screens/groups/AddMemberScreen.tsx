import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { addOfflineMember, addRegisteredMember } from "../../api/groups";
import { lookupByInviteCode } from "../../api/users";

export default function AddMemberScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const [mode, setMode] = useState<"registered" | "offline">("registered");

  // Registered member lookup by invite code
  const [inviteCode, setInviteCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [lookupError, setLookupError] = useState("");

  // Offline member form
  const [offlineName, setOfflineName] = useState("");
  const [offlineEmail, setOfflineEmail] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    setLookupError("");
    setFoundUser(null);
    if (!inviteCode.trim()) return;
    setLooking(true);
    try {
      const result = await lookupByInviteCode(inviteCode.trim());
      if (!result) {
        setLookupError("No user found with that invite code");
      } else {
        setFoundUser(result);
      }
    } catch {
      setLookupError("No user found with that invite code");
    } finally {
      setLooking(false);
    }
  }

  async function handleAddRegistered() {
    if (!foundUser?.id) return;
    setError("");
    setSubmitting(true);
    try {
      await addRegisteredMember(groupId, foundUser.id);
      navigation.goBack();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddOffline() {
    if (!offlineName.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await addOfflineMember(groupId, {
        name: offlineName.trim(),
        email: offlineEmail.trim() || undefined,
        phone: offlinePhone.trim() || undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't add member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, mode === "registered" && styles.tabActive]}
          onPress={() => setMode("registered")}
        >
          <Text style={[styles.tabText, mode === "registered" && styles.tabTextActive]}>
            App User
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === "offline" && styles.tabActive]}
          onPress={() => setMode("offline")}
        >
          <Text style={[styles.tabText, mode === "offline" && styles.tabTextActive]}>
            Offline Member
          </Text>
        </Pressable>
      </View>

      {mode === "registered" ? (
        <View>
          <Text style={styles.hint}>
            Enter the member's invite code (found on their Profile page) to add them.
          </Text>
          <TextInput
            placeholder="Invite code e.g. RC-XXXXXX"
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={setInviteCode}
            style={styles.input}
          />
          <Pressable style={styles.secondaryButton} onPress={handleLookup} disabled={looking}>
            <Text style={styles.secondaryButtonText}>{looking ? "Looking up..." : "Look Up"}</Text>
          </Pressable>

          {looking ? <ActivityIndicator color="#1a6b4a" style={{ marginTop: 12 }} /> : null}
          {lookupError ? <Text style={styles.error}>{lookupError}</Text> : null}

          {foundUser ? (
            <View style={styles.foundCard}>
              <Text style={styles.foundName}>{foundUser.full_name || foundUser.name || "User"}</Text>
              {foundUser.email ? <Text style={styles.foundEmail}>{foundUser.email}</Text> : null}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !foundUser && styles.buttonDisabled]}
            onPress={handleAddRegistered}
            disabled={!foundUser || submitting}
          >
            <Text style={styles.buttonText}>{submitting ? "Adding..." : "Add to Group"}</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <Text style={styles.hint}>
            Add someone without a RoscaApp account. You'll manage their contributions manually.
          </Text>
          <TextInput
            placeholder="Full name"
            value={offlineName}
            onChangeText={setOfflineName}
            style={styles.input}
          />
          <TextInput
            placeholder="Email (optional)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={offlineEmail}
            onChangeText={setOfflineEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Phone (optional)"
            keyboardType="phone-pad"
            value={offlinePhone}
            onChangeText={setOfflinePhone}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleAddOffline} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? "Adding..." : "Add to Group"}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  tabRow: { flexDirection: "row", marginBottom: 20, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#1a6b4a" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  tabActive: { backgroundColor: "#1a6b4a" },
  tabText: { color: "#1a6b4a", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#1a6b4a",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#1a6b4a", fontWeight: "600" },
  foundCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
  },
  foundName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  foundEmail: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  error: { color: "#ef4444", marginTop: 12 },
  button: { backgroundColor: "#1a6b4a", borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});