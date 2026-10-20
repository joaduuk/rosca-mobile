import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { createGroup } from "../../api/groups";
import CurrencyPicker from "../../components/CurrencyPicker";
import OptionButtons from "../../components/OptionButtons";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];
const ROSCA_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "random", label: "Random" },
];

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
      <CurrencyPicker value={currency} onChange={setCurrency} />

      <Text style={styles.label}>Contribution Frequency</Text>
      <OptionButtons options={PERIODS} value={contributionPeriod} onChange={setContributionPeriod} />

      <Text style={styles.label}>Payout Type</Text>
      <OptionButtons options={ROSCA_TYPES} value={roscaType} onChange={setRoscaType} />

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