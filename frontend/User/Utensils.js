import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
      if (res.ok && data.ok) setItems(data.items || []);
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

  const borrowOne = async (utensilId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${utensilId}/borrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qty: 1 })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Failed", data.message || "Cannot borrow.");

      Alert.alert("Success", "Borrowed successfully!");
      load();
    } catch {
      Alert.alert("Error", "Network/server error.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const status = (u.status || "").toLowerCase();
      return name.includes(q) || status.includes(q);
    });
  }, [items, query]);

  const renderItem = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image` : null;
    const out = item.qty <= 0 || item.status === "Out of Stock";

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("UtensilDetails", { item })}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={[styles.img, styles.imgPlaceholder]}>
            <Text style={{ color: COLORS.muted, fontWeight: "900" }}>No Image</Text>
          </View>
        )}

        <View style={{ padding: 12 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            Qty: <Text style={styles.bold}>{item.qty}</Text> • Status:{" "}
            <Text style={[styles.bold, item.status === "Low Stock" && { color: "#b45309" }]}>
              {item.status}
            </Text>
          </Text>

          <View style={styles.row}>
            <Pressable
              style={styles.viewBtn}
              onPress={() => navigation.navigate("UtensilDetails", { item })}
            >
              <Text style={styles.viewBtnText}>View</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, out && { opacity: 0.5 }]}
              onPress={() => borrowOne(item._id)}
              disabled={out}
            >
              <Text style={styles.btnText}>{out ? "Out of Stock" : "Borrow (1)"}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.title}>Utensils</Text>
        <Text style={styles.sub}>Tap a utensil to view details</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search utensils..."
          placeholderTextColor={COLORS.muted}
          style={styles.search}
        />

        <Text style={styles.count}>{filtered.length} result(s)</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 18 },
  topCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.gold },
  sub: { marginTop: 4, color: COLORS.muted },
  search: {
    marginTop: 12,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },
  count: { marginTop: 8, color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden"
  },
  img: { width: "100%", height: 170, backgroundColor: "#eee" },
  imgPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  bold: { fontWeight: "900", color: COLORS.goldDark },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },

  viewBtn: {
    flex: 1,
    backgroundColor: "#fff3cf",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  viewBtnText: { color: COLORS.goldDark, fontWeight: "900" },

  btn: {
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  btnText: { color: "#fff", fontWeight: "900" }
});
