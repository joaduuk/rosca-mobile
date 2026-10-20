import React, { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getGroup,
  listExitRequests,
  listWaitlist,
  makeCycleDecision,
  resumeGroup,
  decideExitRequest,
  decideWaitlist,
  Group,
  ExitRequest,
  WaitlistEntry,
} from "../../api/groups";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending_decision: "Awaiting Decision",
  paused: "Paused",
  ended: "Ended",
};

export default function CycleManagementScreen({ route }: any) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [decision, setDecision] = useState<"continue" | "pause" | "end">("continue");
  const [note, setNote] = useState("");
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionMsg, setDecisionMsg] = useState("");

  async function loadData() {
    try {
      const groupData = await getGroup(groupId);
      setGroup(groupData);
      setDecision((groupData.cycle_decision as any) || "continue");
      const [exitData, waitlistData] = await Promise.all([
        listExitRequests(groupId).catch(() => []),
        listWaitlist(groupId).catch(() => []),
      ]);
      setExitRequests(exitData);
      setWaitlist(waitlistData);
    } catch {
      // silently fail — group detail screen already handles the main error state
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [groupId])
  );

  async function handleSaveDecision() {
    setSavingDecision(true);
    setDecisionMsg("");
    try {
      await makeCycleDecision(groupId, decision, note.trim() || undefined);
      setDecisionMsg("Decision saved");
      await loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setDecisionMsg(typeof detail === "string" ? detail : "Couldn't save decision");
    } finally {
      setSavingDecision(false);
    }
  }

  async function handleResume() {
    setSavingDecision(true);
    setDecisionMsg("");
    try {
      await resumeGroup(groupId);
      setDecisionMsg("Group resumed");
      await loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setDecisionMsg(typeof detail === "string" ? detail : "Couldn't resume group");
    } finally {
      setSavingDecision(false);
    }
  }

  async function handleExitDecision(userId: string, approved: boolean) {
    try {
      await decideExitRequest(groupId, userId, approved);
      setExitRequests((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("Error", typeof detail === "string" ? detail : "Couldn't process request");
    }
  }

  async function handleWaitlistDecision(userId: string, approved: boolean) {
    try {
      await decideWaitlist(groupId, userId, approved);
      setWaitlist((prev) => prev.filter((w) => w.user_id !== userId));
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      Alert.alert("Error", typeof detail === "string" ? detail : "Couldn't process request");
    }
  }

  if (loading || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a6b4a" size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Cycle Decision Panel */}
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Round Management</Text>
          <Text style={styles.statusBadge}>{STATUS_LABELS[group.group_status] || group.group_status}</Text>
        </View>

        {group.group_status === "paused" ? (
          <View>
            <Text style={styles.bodyText}>
              This group is currently paused. No new round will start until you resume it.
              {group.cycle_decision_note ? `\nNote: ${group.cycle_decision_note}` : ""}
            </Text>
            <Pressable style={styles.primaryButton} onPress={handleResume} disabled={savingDecision}>
              <Text style={styles.primaryButtonText}>{savingDecision ? "Resuming..." : "Resume Group"}</Text>
            </Pressable>
          </View>
        ) : group.group_status === "ended" ? (
          <Text style={styles.bodyText}>
            This group has ended. No further rounds will run.
            {group.cycle_decision_note ? `\nNote: ${group.cycle_decision_note}` : ""}
          </Text>
        ) : (
          <View>
            <Text style={styles.bodyText}>
              Set what happens once every member has received their payout and the current round completes.
            </Text>
            <View style={styles.decisionRow}>
              {[
                { value: "continue", label: "Continue" },
                { value: "pause", label: "Pause" },
                { value: "end", label: "End" },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setDecision(opt.value as any)}
                  style={[styles.decisionPill, decision === opt.value && styles.decisionPillActive]}
                >
                  <Text style={[styles.decisionPillText, decision === opt.value && styles.decisionPillTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {(decision === "pause" || decision === "end") && (
              <TextInput
                placeholder="Reason / note (optional)"
                value={note}
                onChangeText={setNote}
                style={styles.input}
              />
            )}
            <Pressable style={styles.primaryButton} onPress={handleSaveDecision} disabled={savingDecision}>
              <Text style={styles.primaryButtonText}>{savingDecision ? "Saving..." : "Save Decision"}</Text>
            </Pressable>
          </View>
        )}

        {decisionMsg ? <Text style={styles.decisionMsg}>{decisionMsg}</Text> : null}
      </View>

      {/* Exit Requests Panel */}
      {exitRequests.length > 0 ? (
        <View style={[styles.panel, styles.exitPanel]}>
          <Text style={styles.panelTitleSmall}>Exit Requests ({exitRequests.length})</Text>
          {exitRequests.map((r) => (
            <View key={r.membership_id} style={styles.requestCard}>
              <Text style={styles.requestName}>{r.user_name}</Text>
              <Text style={styles.requestEmail}>{r.user_email}</Text>
              {r.exit_reason ? <Text style={styles.requestReason}>"{r.exit_reason}"</Text> : null}
              <View style={styles.requestActions}>
                <Pressable style={styles.approveButton} onPress={() => handleExitDecision(r.user_id, true)}>
                  <Text style={styles.approveButtonText}>Approve</Text>
                </Pressable>
                <Pressable style={styles.rejectButton} onPress={() => handleExitDecision(r.user_id, false)}>
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Waitlist Panel */}
      {waitlist.length > 0 ? (
        <View style={[styles.panel, styles.waitlistPanel]}>
          <Text style={styles.panelTitleSmall}>Waitlist ({waitlist.length})</Text>
          {waitlist.map((w) => (
            <View key={w.membership_id} style={styles.requestCard}>
              <Text style={styles.requestName}>{w.user_name}</Text>
              <Text style={styles.requestEmail}>{w.user_email}</Text>
              {w.waitlist_note ? <Text style={styles.requestReason}>"{w.waitlist_note}"</Text> : null}
              <View style={styles.requestActions}>
                <Pressable style={styles.approveButton} onPress={() => handleWaitlistDecision(w.user_id, true)}>
                  <Text style={styles.approveButtonText}>Approve</Text>
                </Pressable>
                <Pressable style={styles.rejectButton} onPress={() => handleWaitlistDecision(w.user_id, false)}>
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  panel: { backgroundColor: "#f8faf9", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  panelTitle: { fontSize: 15, fontWeight: "700", color: "#124d35" },
  panelTitleSmall: { fontSize: 14, fontWeight: "700", color: "#124d35", marginBottom: 10 },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  bodyText: { fontSize: 13, color: "#5a5a5a", lineHeight: 19, marginBottom: 12 },
  decisionRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  decisionPill: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  decisionPillActive: { borderColor: "#1a6b4a", backgroundColor: "#e7f5ef" },
  decisionPillText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  decisionPillTextActive: { color: "#1a6b4a" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  primaryButton: { backgroundColor: "#1a6b4a", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  decisionMsg: { marginTop: 10, fontSize: 13, color: "#1a6b4a" },
  exitPanel: { backgroundColor: "#fff8e6", borderColor: "#f0d080" },
  waitlistPanel: { backgroundColor: "#f0f9f4", borderColor: "#86efac" },
  requestCard: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8 },
  requestName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  requestEmail: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  requestReason: { fontSize: 12, color: "#5a5a5a", marginTop: 6, fontStyle: "italic" },
  requestActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  approveButton: { backgroundColor: "#1a6b4a", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 },
  approveButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  rejectButton: { backgroundColor: "#dc2626", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 },
  rejectButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
});