import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../styles/theme";

export default function AdminProfile({ navigation }) {
  const [user, setUser] = useState({ name: "Admin", email: "", role: "admin" });

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    })();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const showComingSoon = () => {
    Alert.alert("Coming soon", "Edit profile will be added next.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ADMIN</Text>
          </View>
        </View>

        <Text style={styles.title}>Admin Profile</Text>
        <Text style={styles.sub}>Your account details</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user.name || "-"}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email || "-"}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user.role || "admin"}</Text>
        </View>

        <Pressable style={styles.btnOutline} onPress={() => navigation.navigate("AdminLogs")}>
          <Text style={styles.btnOutlineText}>View Logs</Text>
        </Pressable>

        <Pressable style={styles.btnOutline} onPress={showComingSoon}>
          <Text style={styles.btnOutlineText}>Edit Profile</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={logout}>
          <Text style={styles.btnText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 18, justifyContent: "center" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  badgeRow: { flexDirection: "row", justifyContent: "flex-end" },
  badge: {
    backgroundColor: "#fff3cf",
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: { color: COLORS.goldDark, fontWeight: "900", fontSize: 12 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.gold, marginTop: 6 },
  sub: { color: COLORS.muted, marginTop: 4, marginBottom: 14 },
  infoBox: {
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10
  },
  label: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  value: { color: COLORS.text, fontWeight: "900", fontSize: 16, marginTop: 3 },
  btnOutline: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: "center"
  },
  btnOutlineText: { color: COLORS.goldDark, fontWeight: "900" },
  btn: { marginTop: 10, backgroundColor: COLORS.gold, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "900" }
});
