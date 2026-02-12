import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.ok) setLogs(data.logs || []);
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
    if (!q) return logs;
    return logs.filter((l) => {
      const u = `${l.user?.name || ""} ${l.user?.email || ""}`.toLowerCase();
      const utensil = (l.utensil?.name || "").toLowerCase();
      const status = (l.status || "").toLowerCase();
      return u.includes(q) || utensil.includes(q) || status.includes(q);
    });
  }, [logs, query]);

  const downloadPdfToDownloads = async () => {
    try {
      setDownloading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Please login again.");

      // Check endpoint first for better error messages
      const check = await fetch(`${API_URL}/api/admin/logs/pdf`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!check.ok) {
        const text = await check.text().catch(() => "");
        Alert.alert(
          "Download blocked",
          `Server returned ${check.status}.\n${text ? text : "Check admin token/endpoint."}`
        );
        return;
      }

      // 1) Download to cache
      const fileName = `utensil-logs-${Date.now()}.pdf`;
      const tmpUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + fileName;

      const dl = await FileSystem.downloadAsync(
        `${API_URL}/api/admin/logs/pdf`,
        tmpUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2) Ask user to pick folder (choose Downloads)
      const perms = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perms.granted) {
        Alert.alert("Cancelled", "Folder permission not granted.");
        return;
      }

      // 3) Copy file to that folder
      const base64 = await FileSystem.readAsStringAsync(dl.uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perms.directoryUri,
        fileName,
        "application/pdf"
      );

      await FileSystem.writeAsStringAsync(destUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });

      Alert.alert("Downloaded ✅", "Saved to the selected folder (choose Downloads).");
    } catch (e) {
      Alert.alert("Error", `Download failed.\n${String(e?.message || e)}`);
    } finally {
      setDownloading(false);
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = item.status === "returned" ? styles.returned : styles.borrowed;

    return (
      <View style={styles.card}>
        <Text style={styles.titleLine}>
          <Text style={styles.gold}>{item.utensil?.name || "Unknown"}</Text>{" "}
          <Text style={styles.muted}>• Qty {item.qty}</Text>
        </Text>

        <Text style={styles.line}>
          User: <Text style={styles.bold}>{item.user?.name || "Unknown"}</Text>
        </Text>
        <Text style={styles.line}>
          Email: <Text style={styles.bold}>{item.user?.email || "Unknown"}</Text>
        </Text>

        <Text style={styles.line}>
          Status: <Text style={[styles.bold, statusStyle]}>{item.status}</Text>
        </Text>

        <Text style={styles.small}>
          Borrowed: {item.borrowedAt ? new Date(item.borrowedAt).toLocaleString() : "—"}
        </Text>
        <Text style={styles.small}>
          Returned: {item.returnedAt ? new Date(item.returnedAt).toLocaleString() : "—"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.header}>Logs</Text>
        <Text style={styles.sub}>All borrowed and returned utensils</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search user / email / utensil / status..."
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <Pressable style={styles.btnOutline} onPress={onRefresh} disabled={refreshing}>
            <Text style={styles.btnOutlineText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, downloading && { opacity: 0.6 }]}
            onPress={downloadPdfToDownloads}
            disabled={downloading}
          >
            <Text style={styles.btnText}>{downloading ? "Downloading..." : "Download PDF"}</Text>
          </Pressable>
        </View>

        <Text style={styles.count}>{filtered.length} record(s)</Text>
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
  header: { fontSize: 20, fontWeight: "900", color: COLORS.gold },
  sub: { marginTop: 4, color: COLORS.muted },

  input: {
    marginTop: 12,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },

  btn: { flex: 1, backgroundColor: COLORS.gold, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "900" },

  btnOutline: { flex: 1, borderWidth: 1, borderColor: COLORS.gold, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  btnOutlineText: { color: COLORS.goldDark, fontWeight: "900" },

  count: { marginTop: 10, color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10
  },
  titleLine: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  gold: { color: COLORS.gold, fontWeight: "900" },
  muted: { color: COLORS.muted, fontWeight: "800" },
  line: { marginTop: 4, color: COLORS.text },
  bold: { fontWeight: "900" },
  small: { marginTop: 4, color: COLORS.muted, fontSize: 12, fontWeight: "800" },

  borrowed: { color: "#b45309" },
  returned: { color: "#166534" }
});
