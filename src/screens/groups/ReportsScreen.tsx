import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getGroup, Group } from "../../api/groups";
import { listContributions, Contribution } from "../../api/contributions";
import { getGroupSummary, getPayoutSchedule, GroupSummary, Payout } from "../../api/reports";

function formatMoney(amount: number | undefined, currency: string) {
  if (amount == null) return `${currency} 0`;
  return `${currency} ${amount}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
}

type Tab = "summary" | "contributions" | "payouts";

export default function ReportsScreen({ route }: any) {
  const { groupId } = route.params;
  const [group, setGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("summary");

  async function loadData() {
    try {
      const groupData = await getGroup(groupId);
      const [summaryData, contributionData, payoutData] = await Promise.all([
        getGroupSummary(groupId),
        listContributions(groupId),
        getPayoutSchedule(groupId),
      ]);
      setGroup(groupData);
      setSummary(summaryData);
      setContributions(contributionData);
      setPayouts(payoutData);
    } catch {
      // leave whatever loaded
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [groupId])
  );

  if (loading || !group) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a6b4a" size="large" />
      </View>
    );
  }

  const currency = group.currency || "USD";
  const fmt = (n?: number) => formatMoney(n, currency);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {[
          { key: "summary", label: "Summary" },
          { key: "contributions", label: "Contributions" },
          { key: "payouts", label: "Payouts" },
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
          {summary ? (
            <>
              <View style={styles.cardGrid}>
                <SummaryCard label="Total Collected" value={fmt(summary.total_collected)} color="#059669" bg="#f0fdf4" />
                <SummaryCard label="Total Paid Out" value={fmt(summary.total_paid_out)} color="#dc2626" bg="#fef2f2" />
                <SummaryCard label="Current Balance" value={fmt(summary.balance)} color="#2563eb" bg="#eff6ff" />
                <SummaryCard
                  label="Cycles Completed"
                  value={String(summary.total_cycles_completed ?? 0)}
                  color="#1a6b4a"
                  bg="#f0f9f4"
                />
              </View>

              <Text style={styles.sectionTitle}>Current Cycle</Text>
              <View style={styles.row}>
                <Stat label="Current Cycle" value={`#${summary.current_cycle ?? 1}`} />
                <Stat
                  label="Members Paid"
                  value={`${summary.current_cycle_paid ?? 0} / ${summary.total_members ?? 0}`}
                />
              </View>
              <View style={styles.row}>
                <Stat label="Members Pending" value={String(summary.current_cycle_pending ?? 0)} />
              </View>

              {summary.next_payout_date ? (
                <View style={styles.payoutNotice}>
                  <Text style={styles.payoutNoticeLabel}>Next Payout Date</Text>
                  <Text style={styles.payoutNoticeValue}>{formatDate(summary.next_payout_date)}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>Summary data isn't available for this group.</Text>
          )}
        </ScrollView>
      ) : null}

      {tab === "contributions" ? (
        <FlatList
          data={contributions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={contributions.length === 0 ? styles.emptyContainer : styles.tabContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No contributions recorded yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.listCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listCardTitle}>{item.member_name || "Unknown"}</Text>
                <Text style={styles.listCardMeta}>
                  Round {item.round_number || 1} · Cycle {item.cycle_number} · {formatDate(item.paid_date || item.due_date)}
                </Text>
                {item.payment_method ? (
                  <Text style={styles.listCardMeta}>{item.payment_method.replace("_", " ")}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.listCardAmount}>{fmt(item.amount)}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    item.status === "paid" ? styles.statusPaid : styles.statusPending,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      ) : null}

      {tab === "payouts" ? (
        <FlatList
          data={payouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={payouts.length === 0 ? styles.emptyContainer : styles.tabContent}
          ListEmptyComponent={
            <View style={{ alignItems: "center" }}>
              <Text style={styles.emptyText}>No payouts yet.</Text>
              <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>
                Payouts appear here after they are processed.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.listCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listCardTitle}>{item.recipient_name}</Text>
                <Text style={styles.listCardMeta}>
                  Round {item.round_number || 1} · Cycle {item.cycle_number} · {formatDate(item.payout_date)}
                </Text>
                <Text style={styles.listCardMeta}>
                  {item.paid_count}/{item.contributions_count} contributions {item.all_paid ? "✓" : ""}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.listCardAmount}>{fmt(item.amount)}</Text>
                <Text
                  style={[
                    styles.statusBadge,
                    item.status === "paid"
                      ? styles.statusPaid
                      : item.status === "scheduled"
                      ? styles.statusScheduled
                      : styles.statusPending,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      ) : null}
    </View>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
      <Text style={styles.summaryCardLabel}>{label}</Text>
      <Text style={[styles.summaryCardValue, { color }]}>{value}</Text>
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
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#1a6b4a" },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  tabTextActive: { color: "#1a6b4a" },
  tabContent: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  emptyText: { color: "#9ca3af", textAlign: "center" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  summaryCard: { width: "47%", borderRadius: 12, padding: 14 },
  summaryCardLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", textTransform: "uppercase", marginBottom: 6 },
  summaryCardValue: { fontSize: 17, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  stat: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: 12 },
  statLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: "700", color: "#111827" },
  payoutNotice: { backgroundColor: "#fefce8", borderWidth: 1, borderColor: "#fde047", borderRadius: 8, padding: 14, marginTop: 8 },
  payoutNoticeLabel: { fontSize: 12, color: "#854d0e", fontWeight: "700" },
  payoutNoticeValue: { fontSize: 13, color: "#92400e", marginTop: 4 },
  listCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  listCardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  listCardMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  listCardAmount: { fontSize: 15, fontWeight: "700", color: "#111827" },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    textTransform: "capitalize",
    overflow: "hidden",
  },
  statusPaid: { color: "#166534", backgroundColor: "#dcfce7" },
  statusPending: { color: "#991b1b", backgroundColor: "#fee2e2" },
  statusScheduled: { color: "#854d0e", backgroundColor: "#fef9c3" },
});