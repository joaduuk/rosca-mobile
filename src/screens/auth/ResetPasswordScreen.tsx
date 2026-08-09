import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { resetPassword } from "../../api/auth";

function extractToken(input: string): string {
  const trimmed = input.trim();
  // If they pasted a full URL, pull the token query param out of it
  try {
    const url = new URL(trimmed);
    const tokenParam = url.searchParams.get("token");
    if (tokenParam) return tokenParam;
  } catch {
    // Not a valid URL — treat the whole input as the raw token
  }
  return trimmed;
}

export default function ResetPasswordScreen({ navigation }: any) {
  const [tokenInput, setTokenInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const token = extractToken(tokenInput);
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Invalid or expired reset link");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password Reset</Text>
        <Text style={styles.description}>Your password has been updated. You can now log in.</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.description}>
        Paste the reset link (or just the code) from your email, and choose a new password.
      </Text>
      <TextInput
        placeholder="Paste reset link or code"
        autoCapitalize="none"
        value={tokenInput}
        onChangeText={setTokenInput}
        style={styles.input}
        multiline
      />
      <TextInput
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
      />
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Resetting..." : "Reset Password"}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
        <Text style={styles.link}>Back to login</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a6b4a", marginBottom: 8 },
  description: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  error: { color: "#ef4444", marginBottom: 12 },
  button: { backgroundColor: "#1a6b4a", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkWrap: { marginTop: 16, alignItems: "center" },
  link: { color: "#f0a500" },
});