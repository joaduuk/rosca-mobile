import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CURRENCIES, currencyName } from "../constants/currencies";

type Props = {
  value: string;
  onChange: (code: string) => void;
};

export default function CurrencyPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function select(code: string) {
    onChange(code);
    close();
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldText} numberOfLines={1}>
          {value} · {currencyName(value)}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <SafeAreaView style={styles.sheet} edges={["top", "bottom"]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Currency</Text>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or code, e.g. cedi or GHS"
            style={styles.search}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />

          <FlatList
            data={results}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.emptyText}>No currency found</Text>}
            renderItem={({ item }) => {
              const selected = item.code === value;
              return (
                <Pressable style={[styles.row, selected && styles.rowSelected]} onPress={() => select(item.code)}>
                  <Text style={styles.rowCode}>{item.code}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldText: { flex: 1, fontSize: 14, color: "#111827" },
  chevron: { fontSize: 14, color: "#6b7280", marginLeft: 8 },
  sheet: { flex: 1, backgroundColor: "#fff" },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  closeText: { fontSize: 15, color: "#1a6b4a", fontWeight: "600" },
  search: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowSelected: { backgroundColor: "#e7f5ef" },
  rowCode: { width: 56, fontSize: 14, fontWeight: "700", color: "#1a6b4a" },
  rowName: { flex: 1, fontSize: 14, color: "#374151" },
  check: { fontSize: 16, color: "#1a6b4a", fontWeight: "700", marginLeft: 8 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 24 },
});
