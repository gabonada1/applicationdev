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
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.status || "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const renderItem = ({ item }) => {
    // 🔥 CACHE BUSTER HERE
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
          <Image
            source={{ uri: imgUri }}
            style={styles.img}
            resizeMode="cover"
            key={imgUri} // 🔥 force rerender
          />
        ) : (
          <View style={[styles.img, styles.placeholder]}>
            <Text style={{ color: COLORS.muted, fontWeight: "900" }}>
              No Image
            </Text>
          </View>
        )}

        <View style={{ padding: 12 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            Qty: <Text style={styles.bold}>{item.qty}</Text> • Status:{" "}
            <Text style={styles.bold}>{item.status}</Text>
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.title}>Utensils</Text>
        <Text style={styles.sub}>Tap to view details</Text>

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
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
    padding: 10
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden"
  },
  img: { width: "100%", height: 170 },
  placeholder: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  meta: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  bold: { fontWeight: "900", color: COLORS.goldDark }
});
