import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";

export default function Dashboard({ navigation }) {
  const [name, setName] = useState("User");
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [imgV, setImgV] = useState(Date.now());
  const [records, setRecords] = useState([]);

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

  const loadRecords = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return setRecords([]);

      const res = await fetch(`${API_URL}/api/borrows/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setRecords(Array.isArray(data.records) ? data.records : []);
      }
    } catch {}
  };

  const loadAll = async () => {
    await Promise.all([loadUser(), loadItems(), loadRecords()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      loadRecords();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const availableNow = useMemo(() => items.filter((u) => (Number(u.qty) || 0) > 0), [items]);

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

  const borrowAgain = useMemo(() => {
    const availableById = new Map(availableNow.map((item) => [String(item._id), item]));
    const seen = new Set();
    const picks = [];

    records.forEach((record) => {
      if (String(record.status || "").toLowerCase() !== "returned") return;

      const utensilId = record.utensil?._id ? String(record.utensil._id) : "";
      if (!utensilId || seen.has(utensilId)) return;

      const item = availableById.get(utensilId);
      if (!item) return;

      seen.add(utensilId);
      picks.push(item);
    });

    return picks.slice(0, 6);
  }, [availableNow, records]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const availableItems = availableNow.length;
    const totalQty = items.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    const availableQty = availableNow.reduce((sum, u) => sum + (Number(u.qty) || 0), 0);
    return { totalItems, availableItems, totalQty, availableQty };
  }, [items, availableNow]);

  const statusPill = (status) => {
    const current = String(status || "").toLowerCase();
    if (current.includes("out")) return { bg: "#fff1ee", border: "#ffb7a8", text: COLORS.warning, label: "Out of stock" };
    if (current.includes("low")) return { bg: "#fff1ee", border: "#ffb7a8", text: COLORS.warning, label: "Low Stock" };
    return { bg: "#ebfae6", border: "#81da8e", text: COLORS.success, label: status || "Available" };
  };

  const renderItem = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?t=${imgV}` : null;
    const pill = statusPill(item.status);

    return (
      <Pressable
        style={interactivePressable(styles.card, {
          hoverStyle: styles.cardHover,
          pressedStyle: styles.cardPressed
        })}
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

          <Text style={styles.tapHint}>Tap to view</Text>
        </View>

        <FontAwesome name="chevron-right" size={16} color={COLORS.text} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.headerRow}>
          <View style={{ width: 40 }} />
          <Text style={styles.heroTitle}>Dashboard</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.heroSub}>Hi {name}! Here&apos;s what you can borrow today.</Text>

        <View style={styles.searchWrap}>
          <View style={styles.searchField}>
            <FontAwesome name="search" size={18} color="#b3ada2" />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search....."
              placeholderTextColor={COLORS.muted}
              style={styles.search}
            />
          </View>

          <Pressable
            style={interactivePressable(styles.refreshBtn, {
              hoverStyle: styles.refreshBtnHover,
              pressedStyle: styles.refreshBtnPressed
            })}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <FontAwesome name="refresh" size={18} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.availableItems}</Text>
            <Text style={styles.statLabel}>Available Items</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.availableQty}</Text>
            <Text style={styles.statLabel}>Available Quantity</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
        </View>

        <Pressable
          style={interactivePressable(styles.primaryBtn, {
            hoverStyle: styles.primaryBtnHover,
            pressedStyle: styles.primaryBtnPressed
          })}
          onPress={() => navigation.navigate("Utensils")}
        >
          <Text style={styles.primaryBtnText}>Browse All Utensils</Text>
        </Pressable>
      </View>

      {borrowAgain.length ? (
        <View style={styles.borrowAgainBlock}>
          <View style={styles.sectionRowTight}>
            <Text style={styles.sectionTitle}>Borrow Again</Text>
            <Text style={styles.sectionHint}>Based on your returns</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.borrowAgainList}
          >
            {borrowAgain.map((item) => {
              const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?t=${imgV}` : null;

              return (
                <Pressable
                  key={item._id}
                  style={interactivePressable(styles.reborrowCard, {
                    hoverStyle: styles.reborrowCardHover,
                    pressedStyle: styles.reborrowCardPressed
                  })}
                  onPress={() => navigation.navigate("UtensilDetails", { item, imgV })}
                >
                  {imgUri ? (
                    <Image source={{ uri: imgUri }} style={styles.reborrowImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.reborrowImg, styles.imgPlaceholder]}>
                      <Text style={styles.imgPlaceholderText}>No Image</Text>
                    </View>
                  )}

                  <Text style={styles.reborrowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.reborrowMeta}>Qty {item.qty} available</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Available Now</Text>
        <Text style={styles.sectionHint}>{featured.length} item(s)</Text>
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
            <Text style={styles.emptySub}>Try another search or refresh the list.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffdf8" },
  hero: {
    backgroundColor: "#fff8e8",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    borderWidth: 1,
    borderColor: "#efe2c2",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff1c4",
    borderWidth: 1,
    borderColor: "#ecd48f",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    fontWeight: "900",
    color: COLORS.text
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text
  },
  heroSub: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e7dcc6",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  search: {
    flex: 1,
    paddingVertical: 13,
    color: COLORS.text
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff4d2",
    borderWidth: 1,
    borderColor: "#efd68f"
  },
  refreshBtnHover: {
    backgroundColor: "#ffefbf"
  },
  refreshBtnPressed: {
    backgroundColor: "#ffe9a8"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  stat: {
    flex: 1,
    backgroundColor: "#fff3cd",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#efd88f"
  },
  statNum: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  primaryBtnHover: {
    backgroundColor: "#ffcf35"
  },
  primaryBtnPressed: {
    backgroundColor: "#f0bc16"
  },
  primaryBtnText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  sectionRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text
  },
  sectionHint: {
    color: COLORS.muted,
    fontSize: 12
  },
  borrowAgainBlock: {
    paddingTop: 12
  },
  sectionRowTight: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  borrowAgainList: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    gap: 8
  },
  reborrowCard: {
    width: 112,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 16,
    padding: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  reborrowCardHover: {
    backgroundColor: "#fffaf0",
    borderColor: "#ebd89e"
  },
  reborrowCardPressed: {
    backgroundColor: "#fff4dc"
  },
  reborrowImg: {
    width: "100%",
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.soft
  },
  reborrowName: {
    marginTop: 6,
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 12
  },
  reborrowMeta: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800"
  },
  card: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  cardHover: {
    backgroundColor: "#fffaf0",
    borderColor: "#ebd89e"
  },
  cardPressed: {
    backgroundColor: "#fff4dc"
  },
  img: {
    width: 92,
    height: 72,
    borderRadius: 14,
    backgroundColor: COLORS.soft
  },
  imgPlaceholder: {
    alignItems: "center",
    justifyContent: "center"
  },
  imgPlaceholderText: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: "800"
  },
  name: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6
  },
  meta: {
    color: COLORS.text,
    fontSize: 12
  },
  metaStrong: {
    fontWeight: "900",
    color: COLORS.text
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900"
  },
  tapHint: {
    marginTop: 10,
    color: COLORS.muted
  },
  empty: {
    marginHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eadfca"
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text
  },
  emptySub: {
    marginTop: 4,
    color: COLORS.muted
  }
});
