import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listGroups, Group } from "../../api/groups";
import { useAuth } from "../../auth/AuthContext";

export default function GroupsListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function fetchGroups() {
    try {
      const data = await listGroups();
      setGroups(data);
      setError("");
    } catch {
      setError("Couldn't load groups");
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGroups().finally(() => setLoading(false));
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a6b4a" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome, {user?.full_name || user?.email}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a6b4a"]} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No groups yet</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("GroupDetail", { groupId: item.id, groupName: item.name })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.currency} {item.contribution_amount} · {item.contribution_period}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.badge} numberOfLines={1}>
                {item.group_status}
              </Text>
              <Text style={styles.cycle} numberOfLines={1}>
                Cycle {item.current_cycle + 1} 
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: { fontSize: 16, fontWeight: "600", color: "#1a6b4a", flexShrink: 1 },
  logout: { color: "#f0a500", fontWeight: "500" },
  error: { color: "#ef4444", textAlign: "center", marginTop: 12 },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#9ca3af" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  cardSub: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  badge: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#1a6b4a",
    backgroundColor: "#e7f5ef",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  cycle: {
    flexShrink: 1,
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
  },
});