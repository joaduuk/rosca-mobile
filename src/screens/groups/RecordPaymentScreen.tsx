import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { recordContribution } from "../../api/contributions";

const PAYMENT_METHODS = ["cash", "bank_transfer", "mobile_money", "other"];

export default function RecordPaymentScreen({ route, navigation }: any) {
  const { groupId, membershipId, memberName, cycleNumber, amount, currency } = route.params;

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await recordContribution(groupId, {
        membership_id: membershipId,
        cycle_number: cycleNumber,
        amount,
        currency,
        due_date: new Date().toISOString(),
        status: "paid",
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        transaction_reference: reference.trim() || undefined,
      });
      navigation.goBack();
     } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => `${d.loc?.join(".")}: ${d.msg}`).join("\n"));
      } else {
        setError("Couldn't record payment");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Record Payment</Text>
      <Text style={styles.subtitle}>
        {memberName} · Cycle {cycleNumber} · {currency} {amount}
      </Text>

      <Text style={styles.label}>Payment Method</Text>
      <View style={styles.pillRow}>
        {PAYMENT_METHODS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setPaymentMethod(m)}
            style={[styles.pill, paymentMethod === m && styles.pillActive]}
          >
            <Text style={[styles.pillText, paymentMethod === m && styles.pillTextActive]}>
              {m.replace("_", " ")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Transaction Reference (optional)</Text>
      <TextInput
        value={reference}
        onChangeText={setReference}
        style={styles.input}
        placeholder="e.g. bank ref number"
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.textArea]}
        placeholder="Any additional notes"
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Recording..." : "Mark as Paid"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a6b4a" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 20 },
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
  pillText: { color: "#374151", fontSize: 13, textTransform: "capitalize" },
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