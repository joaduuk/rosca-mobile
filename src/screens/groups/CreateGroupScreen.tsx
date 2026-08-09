import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { createGroup } from "../../api/groups";

const PERIODS = ["daily", "weekly", "monthly"];
const ROSCA_TYPES = ["fixed","random"];
const CURRENCIES = ["USD", "GBP", "EUR", "GHS", "NGN", "KES"];

export default function CreateGroupScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionPeriod, setContributionPeriod] = useState("monthly");
  const [memberCount, setMemberCount] = useState("");
  const [roscaType, setRoscaType] = useState("random");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setError("");

    const amount = parseFloat(contributionAmount);
    const count = parseInt(memberCount, 10);

    if (!name.trim()) return setError("Group name is required");
    if (!amount || amount <= 0) return setError("Enter a valid contribution amount");
    if (!count || count < 2) return setError("Member count must be at least 2");

    setSubmitting(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim(),
        contribution_amount: amount,
        contribution_period: contributionPeriod,
        member_count: count,
        rosca_type: roscaType,
        currency,
      });
      navigation.replace("GroupDetail", { groupId: group.id, groupName: group.name });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg).join(", ")
          : "Couldn't create group"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Family Savings" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        placeholder="What's this group for?"
        multiline
      />

      <Text style={styles.label}>Contribution Amount</Text>
      <TextInput
        value={contributionAmount}
        onChangeText={setContributionAmount}
        style={styles.input}
        placeholder="e.g. 50"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Currency</Text>
      <View style={styles.pillRow}>
        {CURRENCIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCurrency(c)}
            style={[styles.pill, currency === c && styles.pillActive]}
          >
            <Text style={[styles.pillText, currency === c && styles.pillTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Contribution Frequency</Text>
      <View style={styles.pillRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setContributionPeriod(p)}
            style={[styles.pill, contributionPeriod === p && styles.pillActive]}
          >
            <Text style={[styles.pillText, contributionPeriod === p && styles.pillTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Payout Type</Text>
      <View style={styles.pillRow}>
        {ROSCA_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setRoscaType(t)}
            style={[styles.pill, roscaType === t && styles.pillActive]}
          >
            <Text style={[styles.pillText, roscaType === t && styles.pillTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Number of Members</Text>
      <TextInput
        value={memberCount}
        onChangeText={setMemberCount}
        style={styles.input}
        placeholder="e.g. 8"
        keyboardType="number-pad"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleCreate} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Creating..." : "Create Group"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: "#1a6b4a", borderColor: "#1a6b4a" },
  pillText: { color: "#374151", fontSize: 13 },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  error: { color: "#ef4444", marginTop: 16 },
  button: {
    backgroundColor: "#1a6b4a",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});