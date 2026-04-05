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
  const [imgV, setImgV] = useState(Date.now());

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
      if (res.ok && data.ok) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setImgV(Date.now());
      }
    } catch {}
  };

  const loadAll = async () => {
    await Promise.all([loadUser(), loadItems()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

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

  const availableNow = useMemo(() => {
    return items.filter((u) => (Number(u.qty) || 0) > 0);
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return availableNow;

    return availableNow.filter((u) => {
      const itemName = (u.name || "").toLowerCase();
      const status = (u.status || "").toLowerCase();
      return itemName.includes(query) || status.includes(query);
    });
  }, [availableNow, q]);

  const featured = useMemo(() => filtered.slice(0, 5), [filtered]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const availableItems = availableNow.length;
    const totalQty = items.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    const availableQty = availableNow.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    return { totalItems, availableItems, totalQty, availableQty };
  }, [items, availableNow]);

  const statusPill = (status) => {
    const current = String(status || "").toLowerCase();
    if (current.includes("out")) return { bg: "#fee2e2", border: "#fecaca", text: COLORS.danger, label: "Out of Stock" };
    if (current.includes("low")) return { bg: "#ffedd5", border: "#fed7aa", text: COLORS.warning, label: "Low Stock" };
    return { bg: COLORS.soft, border: COLORS.border, text: COLORS.goldDark, label: status || "Available" };
  };

  const renderItem = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?t=${imgV}` : null;
    const pill = statusPill(item.status);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("UtensilDetails", { item, imgV })}
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

          <Text style={styles.tapHint}>Tap to view details</Text>
        </View>

        <Text style={styles.chev}>{">"}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>TODAY'S OVERVIEW</Text>
        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSub}>Hi {name}! Here is what you can borrow today.</Text>

        <View style={styles.searchWrap}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search utensils (name/status)..."
            placeholderTextColor={COLORS.muted}
            style={styles.search}
          />
          <Pressable style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.refreshBtnText}>{refreshing ? "..." : "R"}</Text>
          </Pressable>
        </View>

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

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Available now</Text>
        <Text style={styles.sectionHint}>{featured.length} shown</Text>
      </View>

      <FlatList
        data={featured}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
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
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.bgAccent,
    top: -70,
    right: -40,
    opacity: 0.7
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.softAlt,
    color: COLORS.goldDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden"
  },
  heroTitle: { fontSize: 30, fontWeight: "900", color: COLORS.text, marginTop: 14 },
  heroSub: { marginTop: 8, color: COLORS.muted, fontWeight: "700", lineHeight: 21 },
  searchWrap: { flexDirection: "row", gap: 10, marginTop: 14, alignItems: "center" },
  search: {
    flex: 1,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontWeight: "700"
  },
  refreshBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.softAlt,
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
    borderRadius: 20,
    padding: 14
  },
  statNum: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  statLabel: { marginTop: 4, fontSize: 11, fontWeight: "800", color: COLORS.muted },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", letterSpacing: 0.2 },
  sectionRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
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
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  img: { width: 66, height: 66, borderRadius: 18, backgroundColor: COLORS.soft },
  imgPlaceholder: { alignItems: "center", justifyContent: "center" },
  imgPlaceholderText: { fontSize: 10, fontWeight: "900", color: COLORS.muted },
  name: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  meta: { color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  metaStrong: { color: COLORS.goldDark, fontWeight: "900" },
  pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontWeight: "900", fontSize: 11 },
  tapHint: { marginTop: 8, color: COLORS.muted, fontWeight: "800", fontSize: 11 },
  chev: { fontSize: 24, fontWeight: "900", color: COLORS.goldDark, marginLeft: 4 },
  empty: {
    marginHorizontal: 18,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyTitle: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  emptySub: { marginTop: 4, color: COLORS.muted }
});
