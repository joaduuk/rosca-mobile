import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { getMyProfile, updateMyProfile, uploadAvatar, UserProfile } from "../../api/users";
import { useAuth } from "../../auth/AuthContext";
import { API_URL } from "../../config";

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return `${API_URL}${avatarUrl}`;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    } catch {
      setError("Couldn't load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to set an avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setLocalAvatarUri(uri);
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(uri);
      // Reflect the real, permanent server URL once upload succeeds,
      // rather than relying on the local picked file staying around.
      if (res?.avatar_url) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : prev));
      }
    } catch {
      Alert.alert("Upload failed", "Couldn't upload avatar. Try again.");
      setLocalAvatarUri(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleCopyInviteCode() {
    if (!profile?.invite_code) return;
    await Clipboard.setStringAsync(profile.invite_code);
    Alert.alert("Copied", "Invite code copied to clipboard.");
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (newPassword && !currentPassword) {
      setError("Enter your current password to set a new one");
      return;
    }

    setSaving(true);
    try {
      const fields: any = { full_name: fullName, phone };
      if (newPassword) {
        fields.current_password = currentPassword;
        fields.new_password = newPassword;
      }
      const updated = await updateMyProfile(fields);
      setProfile(updated);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Profile updated");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a6b4a" size="large" />
      </View>
    );
  }

  // Priority: local pick while uploading > confirmed server avatar > initials placeholder
  const displayAvatarUri = localAvatarUri || resolveAvatarUrl(profile?.avatar_url);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
        {displayAvatarUri ? (
          <Image source={{ uri: displayAvatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <Text style={styles.avatarLabel}>{uploadingAvatar ? "Uploading..." : "Change photo"}</Text>
      </Pressable>

      <Text style={styles.email}>{profile?.email}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Stat label="Groups" value={String(profile?.groups?.length ?? 0)} />
        <Stat label="Guaranteeing" value={String(profile?.guaranteeing?.length ?? 0)} />
        <Stat label="Member Since" value={formatDate(profile?.created_at)} />
        <Stat label="Status" value={profile?.is_active ? "Active" : "Inactive"} />
      </View>

      {/* Invite code */}
      {profile?.invite_code ? (
        <View style={styles.inviteBox}>
          <Text style={styles.inviteLabel}>Your Invite Code</Text>
          <View style={styles.inviteRow}>
            <Text style={styles.inviteCode}>{profile.invite_code}</Text>
            <Pressable style={styles.copyButton} onPress={handleCopyInviteCode}>
              <Text style={styles.copyButtonText}>Copy</Text>
            </Pressable>
          </View>
          <Text style={styles.inviteHint}>
            Share this code with a group admin to be added to their ROSCA group. Never share it publicly.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Profile Info</Text>
      <TextInput
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />
      <TextInput
        placeholder="Phone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />

      <Text style={styles.sectionTitle}>Change Password</Text>
      <Text style={styles.hint}>Leave blank to keep your current password</Text>

      <View style={styles.passwordWrap}>
        <TextInput
          placeholder="Current password"
          secureTextEntry={!showCurrentPassword}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.passwordInput}
        />
        <Pressable onPress={() => setShowCurrentPassword((v) => !v)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{showCurrentPassword ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>

      <View style={styles.passwordWrap}>
        <TextInput
          placeholder="New password"
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.passwordInput}
        />
        <Pressable onPress={() => setShowNewPassword((v) => !v)} style={styles.eyeButton}>
          <Text style={styles.eyeText}>{showNewPassword ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Changes"}</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarWrap: { alignItems: "center", marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: { backgroundColor: "#e7f5ef", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 32, fontWeight: "700", color: "#1a6b4a" },
  avatarLabel: { color: "#f0a500", marginTop: 8, fontSize: 13 },
  email: { textAlign: "center", color: "#6b7280", marginBottom: 20 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 15, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 10, color: "#9ca3af", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.3 },
  inviteBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  inviteLabel: { fontSize: 11, fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inviteCode: { fontSize: 20, fontWeight: "700", color: "#166534", letterSpacing: 1.5 },
  copyButton: { backgroundColor: "#16a34a", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  copyButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  inviteHint: { fontSize: 11, color: "#166534", marginTop: 8, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 12, marginBottom: 8 },
  hint: { fontSize: 12, color: "#9ca3af", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  eyeButton: { paddingHorizontal: 12 },
  eyeText: { fontSize: 18 },
  error: { color: "#ef4444", marginBottom: 12 },
  success: { color: "#1a6b4a", marginBottom: 12 },
  button: { backgroundColor: "#1a6b4a", borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  logoutButton: { paddingVertical: 14, alignItems: "center", marginTop: 16 },
  logoutText: { color: "#ef4444", fontWeight: "600" },
});