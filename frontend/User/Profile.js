import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
  TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";
import PasswordField from "../components/PasswordField";

export default function Profile({ navigation }) {
  const [user, setUser] = useState({ name: "User", email: "", role: "user" });
  const [records, setRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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

  const borrowed = useMemo(
    () => records.filter((r) => String(r.status).toLowerCase() === "borrowed"),
    [records]
  );
  const returned = useMemo(
    () => records.filter((r) => String(r.status).toLowerCase() === "returned"),
    [records]
  );

  const returnItem = async (borrowId, utensilId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${utensilId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ borrowId })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Cannot return.", "Failed");

      toast.success("Returned successfully!");
      load();
    } catch {
      toast.error("Network/server error.");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const openEditProfile = () => {
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setShowEdit(true);
  };

  const saveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Please login again.");

      setSavingProfile(true);
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return toast.error(data.message || "Could not update profile.", "Update failed");
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setShowEdit(false);
      toast.success("Profile updated.");
    } catch {
      toast.error("Network/server error.");
    } finally {
      setSavingProfile(false);
    }
  };

  const SectionHeader = ({ title }) => (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FontAwesome name="search" size={18} color={COLORS.muted} />
    </View>
  );

  const BorrowCard = ({ item, showReturnButton }) => (
    <View style={styles.item}>
      <Text style={styles.itemName}>{item.utensil?.name || "Unknown"}</Text>
      <Text style={styles.itemMeta}>Quantity: {item.qty}</Text>
      <Text style={styles.itemMeta}>
        Borrowed Date: {item.borrowedAt ? new Date(item.borrowedAt).toLocaleDateString() : "-"}
      </Text>
      <Text style={styles.itemMeta}>
        Time: {item.borrowedAt ? new Date(item.borrowedAt).toLocaleTimeString() : "-"}
      </Text>

      {showReturnButton ? (
        <Pressable
          style={interactivePressable(styles.pillBtn, {
            hoverStyle: styles.pillBtnHover,
            pressedStyle: styles.pillBtnPressed,
            hoveredLift: false
          })}
          onPress={() => returnItem(item._id, item.utensil?._id)}
        >
          <Text style={styles.pillBtnText}>Return</Text>
        </Pressable>
      ) : (
        <View style={styles.returnBar}>
          <Text style={styles.returnBarText}>
            Returned: {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : "-"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.headerIcons}>
          <Pressable
            style={interactivePressable(styles.iconAction, {
              hoverStyle: styles.iconActionHover,
              pressedStyle: styles.iconActionPressed,
              hoveredLift: false
            })}
            onPress={openEditProfile}
          >
            <FontAwesome name="pencil" size={18} color={COLORS.goldDark} />
          </Pressable>

          <Pressable
            style={interactivePressable(styles.iconAction, {
              hoverStyle: styles.iconActionHover,
              pressedStyle: styles.iconActionPressed,
              hoveredLift: false
            })}
            onPress={logout}
          >
            <FontAwesome name="sign-out" size={20} color={COLORS.gold} />
          </Pressable>
        </View>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{String(user.name || "U").slice(0, 1).toUpperCase()}</Text>
        </View>

        <Text style={styles.profileTitle}>{user.name}</Text>
        <Text style={styles.profileSub}>{user.email}</Text>

        <Pressable
          style={interactivePressable(styles.logsBtn, {
            hoverStyle: styles.logsBtnHover,
            pressedStyle: styles.logsBtnPressed
          })}
          onPress={() => navigation.navigate("UserLogs")}
        >
          <Text style={styles.logsBtnText}>My Logs</Text>
        </Pressable>
      </View>

      <FlatList
        data={[{ key: "borrowed" }, { key: "returned" }]}
        keyExtractor={(x) => x.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => {
          if (item.key === "borrowed") {
            return (
              <>
                <SectionHeader title="Borrowed" />
                {borrowed.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>No borrowed items.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={borrowed}
                    keyExtractor={(r) => r._id}
                    renderItem={({ item: row }) => <BorrowCard item={row} showReturnButton />}
                    scrollEnabled={false}
                  />
                )}
              </>
            );
          }

          return (
            <>
              <SectionHeader title="Returned" />
              {returned.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No returned items yet.</Text>
                </View>
              ) : (
                <FlatList
                  data={returned}
                  keyExtractor={(r) => r._id}
                  renderItem={({ item: row }) => <BorrowCard item={row} showReturnButton={false} />}
                  scrollEnabled={false}
                />
              )}
            </>
          );
        }}
      />

      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => !savingProfile && setShowEdit(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSub}>Update your account details.</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={COLORS.muted}
              style={styles.modalInput}
            />

            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Email</Text>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@gmail.com"
              placeholderTextColor={COLORS.muted}
              style={styles.modalInput}
            />

            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Current Password</Text>
            <PasswordField
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Required only to change password"
              placeholderTextColor={COLORS.muted}
              style={styles.modalInput}
            />

            <Text style={[styles.modalLabel, { marginTop: 14 }]}>New Password</Text>
            <PasswordField
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Leave blank to keep current password"
              placeholderTextColor={COLORS.muted}
              style={styles.modalInput}
            />

            <Pressable
              style={interactivePressable(styles.modalPrimaryBtn, {
                hoverStyle: styles.modalPrimaryBtnHover,
                pressedStyle: styles.modalPrimaryBtnPressed
              })}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              <Text style={styles.modalPrimaryBtnText}>{savingProfile ? "Saving..." : "Save Changes"}</Text>
            </Pressable>

            <Pressable
              style={interactivePressable(styles.modalSecondaryBtn, {
                hoverStyle: styles.modalSecondaryBtnHover,
                pressedStyle: styles.modalSecondaryBtnPressed
              })}
              onPress={() => setShowEdit(false)}
              disabled={savingProfile}
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
  container: { flex: 1, backgroundColor: "#fffdf8" },
  profileCard: {
    backgroundColor: "#fff8e8",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#efe2c2",
    marginBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  headerIcons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center"
  },
  iconActionHover: {
    backgroundColor: "#fff1c7"
  },
  iconActionPressed: {
    backgroundColor: "#ffe9a8"
  },
  avatarCircle: {
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fff1c4",
    borderWidth: 1,
    borderColor: "#ecd48f",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text
  },
  profileTitle: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text
  },
  profileSub: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.muted
  },
  logsBtn: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center"
  },
  logsBtnHover: { backgroundColor: "#ffcf35" },
  logsBtnPressed: { backgroundColor: "#f0bc16" },
  logsBtnText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16
  },
  sectionHead: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text
  },
  item: {
    backgroundColor: "#fff4d8",
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 18,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  itemName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text
  },
  itemMeta: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 12
  },
  pillBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  pillBtnHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  pillBtnPressed: { backgroundColor: "#fff2d1" },
  pillBtnText: {
    color: COLORS.text,
    fontWeight: "900"
  },
  returnBar: {
    marginTop: 12,
    backgroundColor: "#fff1c8",
    borderWidth: 1,
    borderColor: "#ecd48f",
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center"
  },
  returnBarText: {
    color: COLORS.text,
    fontWeight: "700"
  },
  empty: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 18,
    marginBottom: 10
  },
  emptyText: {
    color: COLORS.muted,
    fontWeight: "800"
  },
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  modalSub: {
    marginTop: 6,
    color: COLORS.muted,
    lineHeight: 20
  },
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
  modalPrimaryBtnText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
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
  modalSecondaryBtnText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  }
});
