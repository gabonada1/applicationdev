import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
  TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function Dashboard({ navigation }) {
  const [name, setName] = useState("User");
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const loadUser = async () => {
    const raw = await AsyncStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      setName(u.name || "User");
    }
  };

  const loadItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/utensils`);
      const data = await res.json();
      if (res.ok && data.ok) setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // keep old items
    }
  };

  const loadAll = async () => {
    await Promise.all([loadUser(), loadItems()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ refresh when you return to Dashboard
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ✅ Don't filter only "available" — show all items with qty > 0
  const availableNow = useMemo(() => {
    return items.filter((u) => (Number(u.qty) || 0) > 0);
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return availableNow;

    return availableNow.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const status = (u.status || "").toLowerCase();
      return name.includes(query) || status.includes(query);
    });
  }, [availableNow, q]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const availableItems = availableNow.length;
    const totalQty = items.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    const availableQty = availableNow.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    return { totalItems, availableItems, totalQty, availableQty };
  }, [items, availableNow]);

  const statusPill = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("out")) return { bg: "#fee2e2", border: "#fecaca", text: "#991b1b", label: "Out of Stock" };
    if (s.includes("low")) return { bg: "#ffedd5", border: "#fed7aa", text: "#9a3412", label: "Low Stock" };
    return { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534", label: status || "Available" };
  };

  const renderItem = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image` : null;
    const pill = statusPill(item.status);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("UtensilDetails", { utensilId: item._id })}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.img} />
        ) : (
          <View style={[styles.img, styles.imgPlaceholder]}>
            <Text style={styles.imgPlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              Qty: <Text style={styles.metaStrong}>{item.qty}</Text>
            </Text>

            <View style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
              <Text style={[styles.pillText, { color: pill.text }]}>{pill.label}</Text>
            </View>
          </View>

          <Text style={styles.tapHint}>Tap to view</Text>
        </View>

        <Text style={styles.chev}>›</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSub}>Hi {name}! Here’s what you can borrow today.</Text>

        <View style={styles.searchWrap}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search utensils (name/status)..."
            placeholderTextColor={COLORS.muted}
            style={styles.search}
          />
          <Pressable style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.refreshBtnText}>{refreshing ? "..." : "↻"}</Text>
          </Pressable>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.availableItems}</Text>
            <Text style={styles.statLabel}>Available Items</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.availableQty}</Text>
            <Text style={styles.statLabel}>Available Qty</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate("Utensils")}>
          <Text style={styles.primaryBtnText}>Browse All Utensils</Text>
        </Pressable>
      </View>

      {/* LIST HEADER */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Available now</Text>
        <Text style={styles.sectionHint}>{filtered.length} item(s)</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>Try a different search or pull to refresh.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  hero: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  heroTitle: { fontSize: 26, fontWeight: "900", color: COLORS.gold },
  heroSub: { marginTop: 6, color: COLORS.muted, fontWeight: "700" },

  searchWrap: { flexDirection: "row", gap: 10, marginTop: 14, alignItems: "center" },
  search: {
    flex: 1,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontWeight: "700"
  },
  refreshBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#fff3cf",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  refreshBtnText: { fontSize: 18, fontWeight: "900", color: COLORS.goldDark },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 12
  },
  statNum: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  statLabel: { marginTop: 4, fontSize: 11, fontWeight: "800", color: COLORS.muted },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center"
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  sectionRow: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline"
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sectionHint: { fontSize: 12, color: COLORS.muted, fontWeight: "800" },

  card: {
    marginHorizontal: 18,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  img: { width: 62, height: 62, borderRadius: 16, backgroundColor: "#eee" },
  imgPlaceholder: { alignItems: "center", justifyContent: "center" },
  imgPlaceholderText: { fontSize: 10, fontWeight: "900", color: COLORS.muted },

  name: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  meta: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  metaStrong: { color: COLORS.goldDark, fontWeight: "900" },

  pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: "900", fontSize: 11 },

  tapHint: { marginTop: 8, color: COLORS.muted, fontWeight: "800", fontSize: 11 },

  chev: { fontSize: 26, fontWeight: "900", color: COLORS.goldDark, marginLeft: 4 },

  empty: {
    marginHorizontal: 18,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyTitle: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  emptySub: { marginTop: 4, color: COLORS.muted }
});
