import React, { useCallback, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getGroup, listMembers, removeMember, reorderMember, requestExit, cancelExit, Group, Member } from "../../api/groups";
import { listContributions, Contribution } from "../../api/contributions";
import { useAuth } from "../../auth/AuthContext";

type Tab = "summary" | "members";

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("summary");

  const [exitReason, setExitReason] = useState("");
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitBusy, setExitBusy] = useState(false);
  const [exitMsg, setExitMsg] = useState("");

  const myMembership = members.find((m) => m.user_id === user?.id);
  const isAdmin = !!myMembership?.is_admin;

  async function loadData() {
    try {
      const groupData = await getGroup(groupId);
      const [memberData, contributionData] = await Promise.all([
        listMembers(groupId),
        listContributions(groupId, { cycleNumber: groupData.current_cycle + 1 }),
      ]);
      setGroup(groupData);
      setMembers(memberData.sort((a, b) => a.payout_order - b.payout_order));
      setContributions(contributionData);
      setError("");
    } catch {
      setError("Couldn't load group");
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [groupId])
  );

  function paymentFor(membershipId: string): Contribution | undefined {
    return contributions.find((c) => c.membership_id === membershipId);
  }

  async function handleRemove(membershipId: string, name: string) {
    Alert.alert("Remove member", `Remove ${name} from this group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setActionBusyId(membershipId);
          try {
            await removeMember(groupId, membershipId);
            await loadData();
          } catch {
            Alert.alert("Error", "Couldn't remove member");
          } finally {
            setActionBusyId(null);
          }
        },
      },
    ]);
  }

  async function handleReorder(membershipId: string, direction: "up" | "down") {
    setActionBusyId(membershipId);
    try {
      await reorderMember(groupId, membershipId, direction);
      await loadData();
    } catch {
      Alert.alert("Error", "Couldn't reorder member");
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleRequestExit() {
    setExitBusy(true);
    setExitMsg("");
    try {
      await requestExit(groupId, exitReason.trim() || undefined);
      setExitMsg("Exit request submitted. The admin will review it.");
      setShowExitForm(false);
      await loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setExitMsg(typeof detail === "string" ? detail : "Couldn't submit request");
    } finally {
      setExitBusy(false);
    }
  }

  async function handleCancelExit() {
    setExitBusy(true);
    setExitMsg("");
    try {
      await cancelExit(groupId);
      setExitMsg("Exit request cancelled.");
      await loadData();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setExitMsg(typeof detail === "string" ? detail : "Couldn't cancel request");
    } finally {
      setExitBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a6b4a" size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Group not found"}</Text>
      </View>
    );
  }

  const paidCount = members.filter((m) => paymentFor(m.id)?.status === "paid").length;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{group.name}</Text>
        {group.description ? <Text style={styles.description}>{group.description}</Text> : null}

        <Pressable style={styles.reportsButton} onPress={() => navigation.navigate("Reports", { groupId })}>
          <Text style={styles.reportsButtonText}>View Reports</Text>
        </Pressable>

        {isAdmin ? (
          <Pressable
            style={styles.manageButton}
            onPress={() => navigation.navigate("CycleManagement", { groupId })}
          >
            <Text style={styles.manageButtonText}>Manage Round & Requests</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabRow}>
        {[
          { key: "summary", label: "Summary" },
          { key: "members", label: `Members (${members.length})` },
        ].map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key as Tab)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "summary" ? (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <View style={styles.row}>
            <Stat label="Contribution" value={`${group.currency} ${group.contribution_amount}`} />
            <Stat label="Frequency" value={group.contribution_period} />
          </View>
          <View style={styles.row}>
        <Stat label="Members" value={`${members.length} / ${group.member_count}`} />
        <Stat label="Status" value={group.group_status} />
      </View>
      <View style={styles.row}>
        <Stat label="Active Cycle" value={String(group.current_cycle + 1)} />
        <Stat label="Type" value={group.rosca_type} />
      </View>
          <View style={styles.row}>
            <Stat label="Total Collected" value={`${group.currency} ${group.total_collected}`} />
            <Stat label="Total Paid Out" value={`${group.currency} ${group.total_paid_out}`} />
          </View>
          <View style={styles.row}>
            <Stat label="Cycle Progress" value={`${paidCount} / ${members.length} paid`} />
          </View>

          {!isAdmin && myMembership && group.group_status !== "ended" ? (
            <View style={styles.exitBox}>
              {myMembership.membership_status === "exit_requested" ? (
                <View>
                  <Text style={styles.exitPendingText}>Your exit request is pending admin approval.</Text>
                  <Pressable style={styles.cancelExitButton} onPress={handleCancelExit} disabled={exitBusy}>
                    <Text style={styles.cancelExitButtonText}>{exitBusy ? "..." : "Cancel Exit Request"}</Text>
                  </Pressable>
                </View>
              ) : showExitForm ? (
                <View>
                  <Text style={styles.exitHint}>
                    Your request will be reviewed by the admin. You will remain active until approved.
                  </Text>
                  <TextInput
                    placeholder="Reason for leaving (optional)"
                    value={exitReason}
                    onChangeText={setExitReason}
                    style={styles.exitInput}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable style={styles.submitExitButton} onPress={handleRequestExit} disabled={exitBusy}>
                      <Text style={styles.submitExitButtonText}>{exitBusy ? "..." : "Submit Request"}</Text>
                    </Pressable>
                    <Pressable style={styles.cancelFormButton} onPress={() => setShowExitForm(false)}>
                      <Text style={styles.cancelFormButtonText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.requestExitButton} onPress={() => setShowExitForm(true)}>
                  <Text style={styles.requestExitButtonText}>Request to Leave Group</Text>
                </Pressable>
              )}
              {exitMsg ? <Text style={styles.exitMsg}>{exitMsg}</Text> : null}
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      {tab === "members" ? (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {isAdmin ? (
            <Pressable
              style={styles.addMemberButton}
              onPress={() => navigation.navigate("AddMember", { groupId })}
            >
              <Text style={styles.addMemberButtonText}>+ Add Member</Text>
            </Pressable>
          ) : null}

          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members yet</Text>
          ) : (
            members.map((m, index) => {
              const payment = paymentFor(m.id);
              const isPaid = payment?.status === "paid";
              return (
                <View key={m.id} style={styles.memberRow}>
                  <View style={styles.memberOrder}>
                    <Text style={styles.memberOrderText}>{m.payout_order}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {m.user_name || "Unnamed member"}
                      {m.is_admin ? "  ·  Admin" : ""}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {m.user_email || "No email"} · {m.member_status}
                    </Text>
                    <View style={styles.paidBadgeRow}>
                      <Text style={[styles.paidBadge, isPaid ? styles.paidBadgeYes : styles.paidBadgeNo]}>
                        {isPaid ? "Paid" : "Unpaid"}
                      </Text>
                      {isAdmin && !isPaid ? (
                        <Pressable
                          onPress={() =>
                            navigation.navigate("RecordPayment", {
                              groupId,
                              membershipId: m.id,
                              memberName: m.user_name || "this member",
                              cycleNumber: group.current_cycle + 1,
                              amount: group.contribution_amount,
                              currency: group.currency,
                            })
                          }
                        >
                          <Text style={styles.recordLink}>Record Payment</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                  {isAdmin ? (
                    <View style={styles.memberActions}>
                      <Pressable
                        onPress={() => handleReorder(m.id, "up")}
                        disabled={index === 0 || actionBusyId === m.id}
                        style={styles.iconButton}
                      >
                        <Text style={[styles.iconText, index === 0 && styles.iconTextDisabled]}>↑</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleReorder(m.id, "down")}
                        disabled={index === members.length - 1 || actionBusyId === m.id}
                        style={styles.iconButton}
                      >
                        <Text style={[styles.iconText, index === members.length - 1 && styles.iconTextDisabled]}>
                          ↓
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemove(m.id, m.user_name || "this member")}
                        disabled={actionBusyId === m.id}
                        style={styles.iconButton}
                      >
                        <Text style={styles.removeText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "#ef4444" },
  headerBlock: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 24, fontWeight: "700", color: "#1a6b4a" },
  description: { fontSize: 14, color: "#6b7280", marginTop: 6, marginBottom: 16 },
  reportsButton: {
    backgroundColor: "#e7f5ef",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  reportsButtonText: { color: "#1a6b4a", fontWeight: "700", fontSize: 14 },
  manageButton: {
    borderWidth: 1.5,
    borderColor: "#1a6b4a",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  manageButtonText: { color: "#1a6b4a", fontWeight: "700", fontSize: 14 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#1a6b4a" },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  tabTextActive: { color: "#1a6b4a" },
  tabContent: { padding: 20 },
  row: { flexDirection: "row", marginBottom: 16, gap: 12 },
  stat: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exitBox: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, marginTop: 8 },
  exitPendingText: { fontSize: 13, color: "#854d0e", marginBottom: 8 },
  exitHint: { fontSize: 13, color: "#5a5a5a", marginBottom: 10 },
  exitInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  requestExitButton: { borderWidth: 1, borderColor: "#dc2626", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  requestExitButtonText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  submitExitButton: { backgroundColor: "#dc2626", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 },
  submitExitButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  cancelFormButton: { backgroundColor: "#f1f5f9", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 },
  cancelFormButtonText: { color: "#475569", fontWeight: "600", fontSize: 13 },
  cancelExitButton: { backgroundColor: "#dc2626", borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9, alignSelf: "flex-start" },
  cancelExitButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  exitMsg: { marginTop: 8, fontSize: 12, color: "#1a6b4a" },
  addMemberButton: {
    borderWidth: 1.5,
    borderColor: "#1a6b4a",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  addMemberButtonText: { color: "#1a6b4a", fontWeight: "700", fontSize: 14 },
  emptyText: { color: "#9ca3af", textAlign: "center" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  memberOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e7f5ef",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberOrderText: { color: "#1a6b4a", fontWeight: "700", fontSize: 13 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  memberMeta: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  paidBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  paidBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  paidBadgeYes: { color: "#166534", backgroundColor: "#dcfce7" },
  paidBadgeNo: { color: "#991b1b", backgroundColor: "#fee2e2" },
  recordLink: { fontSize: 12, color: "#f0a500", fontWeight: "600" },
  memberActions: { flexDirection: "row", gap: 4 },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  iconText: { fontSize: 16, color: "#1a6b4a", fontWeight: "700" },
  iconTextDisabled: { color: "#d1d5db" },
  removeText: { fontSize: 16, color: "#ef4444", fontWeight: "700" },
});