import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
  Pressable
} from "react-native";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function Utensils({ navigation }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/utensils`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(data.items || []);
      }
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      return (u.name || "").toLowerCase().includes(q) || (u.status || "").toLowerCase().includes(q);
    });
  }, [items, query]);

  const renderItem = ({ item }) => {
    const imgUri = item.hasImage
      ? `${API_URL}/api/utensils/${item._id}/image?t=${Date.now()}`
      : null;

    const out = item.qty <= 0 || item.status === "Out of Stock";

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("UtensilDetails", { item })}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" key={imgUri} />
        ) : (
          <View style={[styles.img, styles.placeholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.pill, out ? styles.pillOut : styles.pillIn]}>
              <Text style={[styles.pillText, out ? styles.pillOutText : styles.pillInText]}>
                {out ? "Out" : item.status || "Available"}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>
            Quantity available: <Text style={styles.bold}>{item.qty}</Text>
          </Text>
          <Text style={styles.hint}>Tap to view more details</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.eyebrow}>UTENSIL CATALOG</Text>
        <Text style={styles.title}>Utensils</Text>
        <Text style={styles.sub}>Browse the full inventory and check current stock fast.</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          placeholderTextColor={COLORS.muted}
          style={styles.search}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 18 },
  topCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.softAlt,
    color: COLORS.goldDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  title: { fontSize: 28, fontWeight: "900", color: COLORS.text, marginTop: 14 },
  sub: { marginTop: 6, color: COLORS.muted, lineHeight: 20 },
  search: {
    marginTop: 12,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  img: { width: "100%", height: 170 },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: COLORS.soft },
  placeholderText: { color: COLORS.muted, fontWeight: "900" },
  content: { padding: 14 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  name: { flex: 1, fontSize: 17, fontWeight: "900", color: COLORS.text },
  meta: { marginTop: 8, color: COLORS.muted, fontSize: 13 },
  bold: { fontWeight: "900", color: COLORS.goldDark },
  hint: { marginTop: 10, color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: "900", fontSize: 11 },
  pillIn: { backgroundColor: COLORS.soft, borderColor: COLORS.border },
  pillInText: { color: COLORS.goldDark },
  pillOut: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  pillOutText: { color: COLORS.danger }
});
