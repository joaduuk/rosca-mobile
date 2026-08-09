import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNotifications } from "../../notifications/NotificationContext";

export default function NotificationsScreen() {
  const { notifications, refresh, markRead, markAllRead, clearAll } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function handleClearAll() {
    Alert.alert("Clear all notifications", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearAll },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <Pressable onPress={markAllRead}>
          <Text style={styles.actionLink}>Mark all read</Text>
        </Pressable>
        <Pressable onPress={handleClearAll}>
          <Text style={[styles.actionLink, styles.clearLink]}>Clear all</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1a6b4a"]} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.is_read && styles.cardUnread]}
            onPress={() => !item.is_read && markRead(item.id)}
          >
            {!item.is_read ? <View style={styles.unreadDot} /> : null}
            <View style={{ flex: 1 }}>
              {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
              <Text style={styles.cardBody}>{item.message || item.body || "New notification"}</Text>
              {item.created_at ? (
                <Text style={styles.cardTime}>{new Date(item.created_at).toLocaleString()}</Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionLink: { color: "#1a6b4a", fontWeight: "600", fontSize: 13 },
  clearLink: { color: "#ef4444" },
  list: { padding: 16 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#9ca3af" },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardUnread: { backgroundColor: "#f8faf9", borderColor: "#cdeadd" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1a6b4a", marginTop: 6 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 },
  cardBody: { fontSize: 13, color: "#374151" },
  cardTime: { fontSize: 11, color: "#9ca3af", marginTop: 6 },
});