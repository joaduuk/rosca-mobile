import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { forgotPassword } from "../../api/auth";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await forgotPassword(email);
    } finally {
      // Backend always returns 200 regardless of whether the email exists,
      // to prevent enumeration — so we always show the same message.
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.description}>
          If an account exists for {email}, we've sent a password reset link. Enter the link from that
          email on the next screen.
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate("ResetPassword")}>
          <Text style={styles.buttonText}>I have my reset link</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
          <Text style={styles.link}>Back to login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.description}>Enter your email and we'll send you a reset link.</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting || !email}>
        <Text style={styles.buttonText}>{submitting ? "Sending..." : "Send Reset Link"}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
        <Text style={styles.link}>Back to login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", color: "#1a6b4a", marginBottom: 8 },
  description: { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  button: { backgroundColor: "#1a6b4a", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkWrap: { marginTop: 16, alignItems: "center" },
  link: { color: "#f0a500" },
});