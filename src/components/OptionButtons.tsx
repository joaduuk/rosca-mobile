import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  // Buttons per row; defaults to all options on one row.
  columns?: number;
};

// Equal-width buttons. Width comes from the row, not the text, so labels are never
// clipped on Android devices whose system font measures wider than Roboto (e.g. Samsung).
export default function OptionButtons({ options, value, onChange, columns = options.length }: Props) {
  const basis = `${100 / columns - 3}%` as const;
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.button, { flexBasis: basis }, active && styles.buttonActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  buttonActive: { borderColor: "#1a6b4a", backgroundColor: "#1a6b4a" },
  // Same weight in both states so the text width never changes on selection.
  text: { fontSize: 13, fontWeight: "600", color: "#374151", textAlign: "center" },
  textActive: { color: "#fff" },
});
