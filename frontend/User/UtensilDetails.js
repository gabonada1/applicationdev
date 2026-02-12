import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function UtensilDetails({ route, navigation }) {
  const { item } = route.params;
  const [qty, setQty] = useState(1);

  const availableQty = Number(item.qty || 0);
  const imgUri = item.hasImage
    ? `${API_URL}/api/utensils/${item._id}/image`
    : null;

  const borrow = async () => {
    try {
      if (qty > availableQty) {
        return Alert.alert("Not enough stock", `Only ${availableQty} available.`);
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${item._id}/borrow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qty })
      });

      const data = await res.json();
      if (!res.ok || !data.ok)
        return Alert.alert("Failed", data.message || "Cannot borrow.");

      Alert.alert("Success", `Borrowed ${qty} item(s)!`);
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Network/server error.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={{ color: COLORS.muted }}>No Image</Text>
          </View>
        )}

        <Text style={styles.title}>{item.name}</Text>

        <Text style={styles.meta}>
          Available: <Text style={styles.bold}>{availableQty}</Text>
        </Text>

        <Text style={styles.meta}>
          Status:{" "}
          <Text
            style={[
              styles.bold,
              item.status === "Low Stock" && { color: "#b45309" }
            ]}
          >
            {item.status}
          </Text>
        </Text>

        {/* Quantity selector */}
        <View style={styles.qtyRow}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setQty((prev) => Math.max(1, prev - 1))}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>

          <TextInput
            value={String(qty)}
            onChangeText={(t) => {
              const n = Number(t.replace(/[^0-9]/g, ""));
              if (!n) return setQty(1);
              setQty(Math.min(n, availableQty));
            }}
            keyboardType="number-pad"
            style={styles.qtyInput}
          />

          <Pressable
            style={styles.stepBtn}
            onPress={() => setQty((prev) => Math.min(availableQty, prev + 1))}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.borrowBtn,
            availableQty <= 0 && { opacity: 0.5 }
          ]}
          onPress={borrow}
          disabled={availableQty <= 0}
        >
          <Text style={styles.borrowText}>
            {availableQty <= 0 ? "Out of Stock" : `Borrow (${qty})`}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 18 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  image: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#eee"
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center"
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.gold,
    marginTop: 14
  },

  meta: {
    marginTop: 6,
    color: COLORS.text,
    fontSize: 14
  },

  bold: {
    fontWeight: "900",
    color: COLORS.goldDark
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
    borderRadius: 12,
    backgroundColor: "#fff3cf",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },

  stepText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.goldDark
  },

  qtyInput: {
    width: 70,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    backgroundColor: COLORS.soft
  },

  borrowBtn: {
    marginTop: 20,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center"
  },

  borrowText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  }
});
