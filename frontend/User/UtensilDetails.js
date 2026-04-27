import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";

export default function UtensilDetails({ route, navigation }) {
  const { item } = route.params;
  const availableQty = Math.max(0, Number(item.qty) || 0);
  const [qty, setQty] = useState(availableQty > 0 ? 1 : 0);

  const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?t=${Date.now()}` : null;

  const borrow = async () => {
    try {
      if (qty > availableQty) {
        return toast.error(`Only ${availableQty} available.`, "Not enough stock");
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${item._id}/borrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qty })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return toast.error(data.message || "Cannot borrow.", "Failed");
      }

      toast.success(`Borrowed ${qty} item(s)!`);
      navigation.goBack();
    } catch {
      toast.error("Network/server error.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
      <View style={styles.card}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={{ color: COLORS.muted }}>No Image</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{availableQty > 0 ? item.status || "Available" : "Unavailable"}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>Choose a quantity and confirm your borrow request.</Text>

        <Text style={styles.meta}>Available: <Text style={styles.bold}>{availableQty}</Text></Text>
        <Text style={styles.meta}>Status: <Text style={styles.bold}>{item.status}</Text></Text>

        <View style={styles.qtyRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.stepBtn,
              availableQty <= 0 && styles.disabled,
              hovered && availableQty > 0 && styles.stepBtnHover,
              pressed && availableQty > 0 && styles.stepBtnPressed
            ]}
            onPress={() => setQty((prev) => Math.max(1, prev - 1))}
            disabled={availableQty <= 0}
          >
            <Text style={styles.stepText}>-</Text>
          </Pressable>

          <TextInput
            value={String(qty)}
            onChangeText={(t) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!n) return setQty(availableQty > 0 ? 1 : 0);
              setQty(Math.min(n, availableQty));
            }}
            keyboardType="number-pad"
            style={styles.qtyInput}
            editable={availableQty > 0}
          />

          <Pressable
            style={({ pressed, hovered }) => [
              styles.stepBtn,
              availableQty <= 0 && styles.disabled,
              hovered && availableQty > 0 && styles.stepBtnHover,
              pressed && availableQty > 0 && styles.stepBtnPressed
            ]}
            onPress={() => setQty((prev) => Math.min(availableQty, prev + 1))}
            disabled={availableQty <= 0}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed, hovered }) => [
            styles.borrowBtn,
            availableQty <= 0 && styles.disabled,
            hovered && availableQty > 0 && styles.borrowBtnHover,
            pressed && availableQty > 0 && styles.borrowBtnPressed
          ]}
          onPress={borrow}
          disabled={availableQty <= 0}
        >
          <Text style={styles.borrowText}>{availableQty <= 0 ? "Out of Stock" : `Borrow (${qty})`}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffdf8", padding: 18 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: "#eadfca",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: COLORS.white
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center"
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16
  },
  badge: {
    backgroundColor: "#fff2c8",
    borderWidth: 1,
    borderColor: "#eed283",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: {
    color: COLORS.goldDark,
    fontWeight: "900",
    fontSize: 11
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: 12
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.muted,
    lineHeight: 20
  },
  meta: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 14
  },
  bold: {
    fontWeight: "900",
    color: COLORS.text
  },
  qtyRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: "#f3ca52",
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnHover: { backgroundColor: "#ffcf35" },
  stepBtnPressed: { backgroundColor: "#f0bc16" },
  stepText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white
  },
  qtyInput: {
    width: 70,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    backgroundColor: COLORS.white
  },
  borrowBtn: {
    marginTop: 20,
    backgroundColor: COLORS.gold,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  borrowBtnHover: { backgroundColor: "#ffcf35" },
  borrowBtnPressed: { backgroundColor: "#f0bc16" },
  borrowText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16
  },
  disabled: {
    opacity: 0.5
  }
});
