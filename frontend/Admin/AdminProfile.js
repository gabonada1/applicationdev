import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { API_URL } from "../config";
import { toast } from "../components/toast";
import PasswordField from "../components/PasswordField";

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <FontAwesome name={icon} size={15} color={COLORS.goldDark} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>{value || "-"}</Text>
      </View>
    </View>
  );
}

function AccessCard({ icon, title, subtitle, onPress }) {
  return (
    <Pressable
      style={interactivePressable(styles.accessCard, {
        hoverStyle: styles.accessCardHover,
        pressedStyle: styles.accessCardPressed
      })}
      onPress={onPress}
    >
      <View style={styles.accessIcon}>
        <FontAwesome name={icon} size={18} color={COLORS.goldDark} />
      </View>
      <View style={styles.accessCopy}>
        <Text style={styles.accessTitle}>{title}</Text>
        <Text style={styles.accessSub}>{subtitle}</Text>
      </View>
      <FontAwesome name="angle-right" size={20} color={COLORS.muted} />
    </Pressable>
  );
}

export default function AdminProfile({ navigation }) {
  const [user, setUser] = useState({ name: "Admin", email: "", role: "admin" });
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    })();
  }, []);

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

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

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
          <Text style={styles.avatarText}>{String(user.name || "A").slice(0, 1).toUpperCase()}</Text>
        </View>

        <Text style={styles.profileTitle}>{user.name}</Text>
        <Text style={styles.profileSub}>{user.email}</Text>

        <Pressable
          style={interactivePressable(styles.logsBtn, {
            hoverStyle: styles.logsBtnHover,
            pressedStyle: styles.logsBtnPressed
          })}
          onPress={() => navigation.navigate("AdminLogs")}
        >
          <Text style={styles.logsBtnText}>View Activity</Text>
        </Pressable>

        <Pressable
          style={interactivePressable(styles.usersBtn, {
            hoverStyle: styles.usersBtnHover,
            pressedStyle: styles.usersBtnPressed
          })}
          onPress={() => navigation.navigate("AdminUsers")}
        >
          <Text style={styles.usersBtnText}>Manage Users</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.sections} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
        </View>

        <View style={styles.detailsPanel}>
          <DetailRow icon="id-badge" label="Account Role" value={(user.role || "admin").toUpperCase()} />
          <DetailRow icon="envelope" label="Email Address" value={user.email || "No email saved"} />
          <DetailRow icon="shield" label="Access Level" value="Full admin controls" />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
        </View>

        <View style={styles.accessList}>
          <AccessCard
            icon="history"
            title="Activity"
            subtitle="Review borrow and return records"
            onPress={() => navigation.navigate("AdminLogs")}
          />
          <AccessCard
            icon="users"
            title="Users"
            subtitle="Edit names, roles, and accounts"
            onPress={() => navigation.navigate("AdminUsers")}
          />
          <AccessCard
            icon="cutlery"
            title="Utensils"
            subtitle="Add, update, and monitor inventory"
            onPress={() => navigation.navigate("AdminUtensils")}
          />
        </View>
      </ScrollView>

      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => !savingProfile && setShowEdit(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSub}>Update your admin account details and password.</Text>

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
              placeholder="name@buksu.edu.ph"
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
  container: {
    flex: 1,
    backgroundColor: "#fffdf8"
  },
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
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#fff1c4",
    borderWidth: 1,
    borderColor: "#ecd48f",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.text
  },
  profileTitle: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  profileSub: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    color: COLORS.muted
  },
  logsBtn: {
    marginTop: 20,
    backgroundColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center"
  },
  logsBtnHover: { backgroundColor: "#ffcf35" },
  logsBtnPressed: { backgroundColor: "#f0bc16" },
  logsBtnText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16
  },
  usersBtn: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center"
  },
  usersBtnHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  usersBtnPressed: { backgroundColor: "#fff2d1" },
  usersBtnText: {
    color: COLORS.goldDark,
    fontWeight: "900",
    fontSize: 16
  },
  sections: {
    flex: 1
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
  detailsPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 6,
    marginHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f4eee0"
  },
  detailRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff1c4",
    borderWidth: 1,
    borderColor: "#ecd48f",
    alignItems: "center",
    justifyContent: "center"
  },
  detailTextWrap: {
    flex: 1
  },
  detailLabel: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12
  },
  detailValue: {
    marginTop: 3,
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  accessList: {
    marginHorizontal: 18,
    gap: 10
  },
  accessCard: {
    minHeight: 76,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfca",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  accessCardHover: {
    backgroundColor: "#fff8ea",
    borderColor: "#e8d49e"
  },
  accessCardPressed: {
    backgroundColor: "#fff2d1"
  },
  accessIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff8e8",
    alignItems: "center",
    justifyContent: "center"
  },
  accessCopy: {
    flex: 1
  },
  accessTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  accessSub: {
    marginTop: 3,
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 17
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
