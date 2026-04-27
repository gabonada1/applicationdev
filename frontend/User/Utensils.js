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
import { FontAwesome } from "@expo/vector-icons";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";

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
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?t=${Date.now()}` : null;
    const out = item.qty <= 0 || item.status === "Out of Stock";

    return (
      <Pressable
        style={interactivePressable(styles.card, {
          hoverStyle: styles.cardHover,
          pressedStyle: styles.cardPressed
        })}
        onPress={() => navigation.navigate("UtensilDetails", { item })}
      >
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.img} resizeMode="contain" key={imgUri} />
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
                {out ? "Unavailable" : item.status || "Available"}
              </Text>
            </View>
          </View>

          <Text style={styles.meta}>
            Qty: <Text style={styles.bold}>{item.qty}</Text>
          </Text>

          <Pressable
            style={({ pressed, hovered }) => [
              styles.borrowBtn,
              out && styles.borrowDisabled,
              hovered && !out && styles.borrowBtnHover,
              pressed && !out && styles.borrowBtnPressed
            ]}
            onPress={() => navigation.navigate("UtensilDetails", { item })}
            disabled={out}
          >
            <Text style={styles.borrowText}>{out ? "Unavailable" : "Borrow"}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.title}>Utensils</Text>

        <View style={styles.searchRow}>
          <FontAwesome name="search" size={18} color="#b3ada2" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search....."
            placeholderTextColor={COLORS.muted}
            style={styles.search}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffdf8" },
  topCard: {
    backgroundColor: "#fff8e8",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: "#efe2c2",
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 14
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e7dcc6",
    borderRadius: 18,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  search: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.text
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: COLORS.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#eadfca",
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  cardHover: {
    backgroundColor: "#fffaf0",
    borderColor: "#ebd89e"
  },
  cardPressed: {
    backgroundColor: "#fff4dc"
  },
  img: {
    width: "100%",
    height: 170,
    backgroundColor: COLORS.white
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.soft
  },
  placeholderText: {
    color: COLORS.muted,
    fontWeight: "900"
  },
  content: {
    padding: 14
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text
  },
  meta: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 13
  },
  bold: {
    fontWeight: "900",
    color: COLORS.text
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  pillText: {
    fontWeight: "900",
    fontSize: 11
  },
  pillIn: {
    backgroundColor: "#ebfae6",
    borderColor: COLORS.success
  },
  pillInText: {
    color: COLORS.success
  },
  pillOut: {
    backgroundColor: "#fff1ee",
    borderColor: COLORS.warning
  },
  pillOutText: {
    color: COLORS.warning
  },
  borrowBtn: {
    marginTop: 12,
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center"
  },
  borrowBtnHover: { backgroundColor: "#ffcf35" },
  borrowBtnPressed: { backgroundColor: "#f0bc16" },
  borrowText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14
  },
  borrowDisabled: {
    opacity: 0.55
  }
});
