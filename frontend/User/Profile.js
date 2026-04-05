import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Alert, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function Profile({ navigation }) {
  const [user, setUser] = useState({ name: "User", email: "", role: "user" });
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/borrows/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.ok) setRecords(data.records || []);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
      load();
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const borrowed = useMemo(() => records.filter((r) => String(r.status).toLowerCase() === "borrowed"), [records]);
  const returned = useMemo(() => records.filter((r) => String(r.status).toLowerCase() === "returned"), [records]);

  const returnItem = async (borrowId, utensilId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${utensilId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ borrowId })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Failed", data.message || "Cannot return.");

      Alert.alert("Success", "Returned successfully!");
      load();
    } catch {
      Alert.alert("Error", "Network/server error.");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const CardRow = ({ title, subtitle }) => (
    <View style={styles.headerCard}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
    </View>
  );

  const renderBorrowed = ({ item }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.utensil?.name || "Unknown"}</Text>
        <Text style={styles.itemMeta}>Qty: <Text style={styles.bold}>{item.qty}</Text></Text>
      </View>

      <Pressable style={styles.pillBtn} onPress={() => returnItem(item._id, item.utensil?._id)}>
        <Text style={styles.pillBtnText}>Return</Text>
      </Pressable>
    </View>
  );

  const renderReturned = ({ item }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.utensil?.name || "Unknown"}</Text>
        <Text style={styles.itemMeta}>Qty: <Text style={styles.bold}>{item.qty}</Text></Text>
        <Text style={styles.small}>Returned</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.profileTitle}>Profile</Text>
        <Text style={styles.profileSub}>{user.name} | {user.email}</Text>

        <Pressable style={styles.btnOutline} onPress={() => navigation.navigate("UserLogs")}>
          <Text style={styles.btnOutlineText}>My Logs</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <FlatList
        data={[{ key: "borrowed" }, { key: "returned" }]}
        keyExtractor={(x) => x.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          if (item.key === "borrowed") {
            return (
              <>
                <CardRow title="Borrowed" subtitle="Items you currently have" />
                {borrowed.length === 0 ? (
                  <View style={styles.empty}><Text style={styles.emptyText}>No borrowed items.</Text></View>
                ) : (
                  <FlatList data={borrowed} keyExtractor={(r) => r._id} renderItem={renderBorrowed} scrollEnabled={false} />
                )}
              </>
            );
          }
          return (
            <>
              <CardRow title="Returned" subtitle="Your history" />
              {returned.length === 0 ? (
                <View style={styles.empty}><Text style={styles.emptyText}>No returned items yet.</Text></View>
              ) : (
                <FlatList data={returned} keyExtractor={(r) => r._id} renderItem={renderReturned} scrollEnabled={false} />
              )}
            </>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 18 },
  profileCard: {
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
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  profileTitle: { fontSize: 28, fontWeight: "900", color: COLORS.text, marginTop: 14 },
  profileSub: { marginTop: 6, color: COLORS.muted, lineHeight: 20 },
  btnOutline: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.soft,
    alignItems: "center"
  },
  btnOutlineText: { color: COLORS.goldDark, fontWeight: "900" },
  logoutBtn: {
    marginTop: 10,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center"
  },
  logoutText: { color: "#fff", fontWeight: "900" },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
    marginBottom: 10
  },
  title: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  sub: { marginTop: 4, color: COLORS.muted },
  item: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  itemName: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  itemMeta: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  bold: { fontWeight: "900", color: COLORS.goldDark },
  small: { marginTop: 6, color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  pillBtn: {
    backgroundColor: COLORS.softAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  pillBtnText: { color: COLORS.goldDark, fontWeight: "900" },
  empty: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10
  },
  emptyText: { color: COLORS.muted, fontWeight: "800" }
});
