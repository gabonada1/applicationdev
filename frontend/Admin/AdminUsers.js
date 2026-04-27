import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const rawUser = await AsyncStorage.getItem("user");
      if (rawUser) setCurrentUser(JSON.parse(rawUser));
      if (!token) return;

      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || "Could not load users.");
      }
    } catch {
      toast.error("Network/server error.");
    }
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
    if (!q) return users;

    return users.filter((user) => {
      const haystack = `${user.name || ""} ${user.email || ""} ${user.role || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query]);

  const replaceUser = (nextUser) => {
    setUsers((items) => items.map((item) => (item._id === nextUser._id ? nextUser : item)));
  };

  const updateUser = async (userId, payload) => {
    try {
      setBusyId(userId);
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Please login again.");

      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return toast.error(data.message || "Could not update user.");
      }

      replaceUser(data.user);
      toast.success("User updated.");
    } catch {
      toast.error("Network/server error.");
    } finally {
      setBusyId(null);
    }
  };

  const saveName = async () => {
    if (!editingUser) return;
    await updateUser(editingUser._id, { name: editName });
    setEditingUser(null);
  };

  const toggleRole = (item) => {
    updateUser(item._id, { role: item.role === "admin" ? "user" : "admin" });
  };

  const deleteUser = async (item) => {
    try {
      setBusyId(item._id);
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Please login again.");

      const res = await fetch(`${API_URL}/api/admin/users/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return toast.error(data.message || "Could not delete user.");
      }

      setUsers((items) => items.filter((user) => user._id !== item._id));
      toast.success("User deleted.");
    } catch {
      toast.error("Network/server error.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeleteUser = (item) => {
    Alert.alert(
      "Delete user?",
      `Remove ${item.name || item.email || "this user"} from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteUser(item) }
      ]
    );
  };

  const openEdit = (item) => {
    setEditingUser(item);
    setEditName(item.name || "");
  };

  const renderItem = ({ item }) => {
    const isSelf = String(item._id) === String(currentUser?.id || currentUser?._id);
    const isBusy = busyId === item._id;
    const roleStyle = item.role === "admin" ? styles.adminRole : styles.userRole;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{String(item.name || item.email || "U").slice(0, 1).toUpperCase()}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name || "Unnamed User"}</Text>
            <Text style={styles.email}>{item.email || "No email"}</Text>
          </View>

          <Text style={[styles.roleBadge, roleStyle]}>{item.role}</Text>
        </View>

        <Text style={styles.small}>Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</Text>

        <View style={styles.actions}>
          <Pressable
            style={interactivePressable(styles.actionOutline, {
              hoverStyle: styles.actionOutlineHover,
              pressedStyle: styles.actionOutlinePressed
            })}
            onPress={() => openEdit(item)}
            disabled={isBusy}
          >
            <FontAwesome name="pencil" size={14} color={COLORS.goldDark} />
            <Text style={styles.actionOutlineText}>Edit</Text>
          </Pressable>

          <Pressable
            style={(state) => [
              ...interactivePressable(styles.actionOutline, {
                hoverStyle: styles.actionOutlineHover,
                pressedStyle: styles.actionOutlinePressed
              })(state),
              (isSelf || isBusy) && styles.disabledBtn
            ]}
            onPress={() => toggleRole(item)}
            disabled={isSelf || isBusy}
          >
            <FontAwesome name="exchange" size={14} color={COLORS.goldDark} />
            <Text style={styles.actionOutlineText}>{item.role === "admin" ? "Make User" : "Make Admin"}</Text>
          </Pressable>

          <Pressable
            style={({ hovered, pressed }) => [
              styles.deleteBtn,
              (isSelf || isBusy) && styles.disabledBtn,
              hovered && !isSelf && !isBusy && styles.deleteBtnHover,
              pressed && !isSelf && !isBusy && styles.deleteBtnPressed
            ]}
            onPress={() => confirmDeleteUser(item)}
            disabled={isSelf || isBusy}
          >
            <FontAwesome name="trash" size={14} color={COLORS.white} />
            <Text style={styles.deleteText}>{isBusy ? "Working..." : "Delete"}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCard}>
        <Text style={styles.header}>Users</Text>
        <Text style={styles.sub}>Manage every registered account</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name / email / role..."
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <View style={styles.summaryRow}>
          <Text style={styles.count}>{filtered.length} user(s)</Text>
          <Pressable
            style={interactivePressable(styles.refreshBtn, {
              hoverStyle: styles.refreshBtnHover,
              pressedStyle: styles.refreshBtnPressed
            })}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <FontAwesome name="refresh" size={14} color={COLORS.goldDark} />
            <Text style={styles.refreshText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!editingUser} transparent animationType="fade" onRequestClose={() => setEditingUser(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setEditingUser(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit User</Text>
            <Text style={styles.modalSub}>{editingUser?.email}</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="User name"
              placeholderTextColor={COLORS.muted}
              style={styles.modalInput}
            />

            <Pressable
              style={interactivePressable(styles.modalPrimaryBtn, {
                hoverStyle: styles.modalPrimaryBtnHover,
                pressedStyle: styles.modalPrimaryBtnPressed
              })}
              onPress={saveName}
              disabled={busyId === editingUser?._id}
            >
              <Text style={styles.modalPrimaryBtnText}>{busyId === editingUser?._id ? "Saving..." : "Save Changes"}</Text>
            </Pressable>

            <Pressable
              style={interactivePressable(styles.modalSecondaryBtn, {
                hoverStyle: styles.modalSecondaryBtnHover,
                pressedStyle: styles.modalSecondaryBtnPressed
              })}
              onPress={() => setEditingUser(null)}
              disabled={busyId === editingUser?._id}
            >
              <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fffdf8", padding: 18 },
  topCard: {
    backgroundColor: "#fff8e8",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#efe2c2",
    marginBottom: 12
  },
  header: { fontSize: 20, fontWeight: "900", color: COLORS.gold },
  sub: { marginTop: 4, color: COLORS.muted },
  input: {
    marginTop: 12,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e7dcc6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },
  summaryRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  count: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.white
  },
  refreshBtnHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  refreshBtnPressed: { backgroundColor: "#fff2d1" },
  refreshText: { color: COLORS.goldDark, fontWeight: "900" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadfca",
    marginBottom: 10
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff1c4",
    borderWidth: 1,
    borderColor: "#ecd48f",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { color: COLORS.text, fontWeight: "900", fontSize: 16 },
  userInfo: { flex: 1 },
  name: { color: COLORS.text, fontWeight: "900", fontSize: 15 },
  email: { marginTop: 3, color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  roleBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  adminRole: { backgroundColor: "#fff1c4", color: COLORS.goldDark },
  userRole: { backgroundColor: "#eef8ef", color: COLORS.success },
  small: { marginTop: 10, color: COLORS.muted, fontSize: 12, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionOutline: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 14,
    backgroundColor: COLORS.white
  },
  actionOutlineHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  actionOutlinePressed: { backgroundColor: "#fff2d1" },
  actionOutlineText: { color: COLORS.goldDark, fontWeight: "900", fontSize: 12 },
  deleteBtn: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: COLORS.danger
  },
  deleteBtnHover: { backgroundColor: "#dc2626" },
  deleteBtnPressed: { backgroundColor: "#b91c1c" },
  deleteText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
  disabledBtn: { opacity: 0.45 },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: 22
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(48, 38, 18, 0.28)"
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eadfca",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  modalTitle: { fontSize: 24, fontWeight: "900", color: COLORS.text },
  modalSub: { marginTop: 6, color: COLORS.muted, lineHeight: 20 },
  modalLabel: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text
  },
  modalInput: {
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#e7dcc6",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15
  },
  modalPrimaryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center"
  },
  modalPrimaryBtnHover: { backgroundColor: "#ffcf35" },
  modalPrimaryBtnPressed: { backgroundColor: "#f0bc16" },
  modalPrimaryBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 15 },
  modalSecondaryBtn: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center"
  },
  modalSecondaryBtnHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  modalSecondaryBtnPressed: { backgroundColor: "#fff2d1" },
  modalSecondaryBtnText: { color: COLORS.text, fontWeight: "900", fontSize: 15 }
});
