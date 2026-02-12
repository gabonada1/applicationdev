import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Modal,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";

export default function AdminUtensils() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  // modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // form states (used for both add & edit)
  const [formId, setFormId] = useState(null); // for edit
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [status, setStatus] = useState("Available");
  const [pickedImage, setPickedImage] = useState(null); // { uri, ... } from ImagePicker
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/api/utensils`);
      const data = await res.json();
      if (res.ok && data.ok) setItems(data.items || []);
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
      const n = (u.name || "").toLowerCase();
      const s = (u.status || "").toLowerCase();
      return n.includes(q) || s.includes(q);
    });
  }, [items, query]);

  const resetForm = () => {
    setFormId(null);
    setName("");
    setQty("1");
    setStatus("Available");
    setPickedImage(null);
  };

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const openEdit = (item) => {
    setFormId(item._id);
    setName(item.name || "");
    setQty(String(item.qty ?? 1));
    setStatus(item.status || "Available");
    setPickedImage(null); // new image optional; keep old unless user picks new
    setShowEdit(true);
  };

  const closeModals = () => {
    setShowAdd(false);
    setShowEdit(false);
    resetForm();
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow access to photos to pick an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (!result.canceled) setPickedImage(result.assets[0]);
  };

  const buildFormData = () => {
    const form = new FormData();
    form.append("name", name.trim());
    form.append("qty", String(Number(qty)));
    form.append("status", status.trim() || "Available");

    if (pickedImage?.uri) {
      const parts = pickedImage.uri.split(".");
      const ext = (parts[parts.length - 1] || "jpg").toLowerCase();
      const mime = ext === "jpg" ? "jpeg" : ext;

      form.append("image", {
        uri: pickedImage.uri,
        name: `utensil.${ext}`,
        type: `image/${mime}`
      });
    }

    return form;
  };

  const createUtensil = async () => {
    if (!name.trim()) return Alert.alert("Missing", "Enter utensil name.");
    if (!qty || isNaN(Number(qty)) || Number(qty) < 0) return Alert.alert("Invalid", "Qty must be 0 or more.");

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Missing token. Please login again.");

      const res = await fetch(`${API_URL}/api/utensils`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData()
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Failed", data.message || "Could not add utensil.");

      Alert.alert("Success", "Utensil added!");
      closeModals();
      load();
    } catch {
      Alert.alert("Error", "Network/server error.");
    } finally {
      setSaving(false);
    }
  };

  const updateUtensil = async () => {
    if (!formId) return;
    if (!name.trim()) return Alert.alert("Missing", "Enter utensil name.");
    if (!qty || isNaN(Number(qty)) || Number(qty) < 0) return Alert.alert("Invalid", "Qty must be 0 or more.");

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return Alert.alert("Error", "Missing token. Please login again.");

      // ✅ requires backend PUT route (see below)
      const res = await fetch(`${API_URL}/api/utensils/${formId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData()
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Failed", data.message || "Could not update utensil.");

      Alert.alert("Success", "Utensil updated!");
      closeModals();
      load();
    } catch {
      Alert.alert("Error", "Network/server error.");
    } finally {
      setSaving(false);
    }
  };

  const UtensilCard = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image` : null;

    return (
      <View style={styles.listCard}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.listImg} resizeMode="cover" />
        ) : (
          <View style={[styles.listImg, styles.noImg]}>
            <Text style={{ color: COLORS.muted, fontWeight: "900" }}>No Image</Text>
          </View>
        )}

        <View style={{ padding: 12 }}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listMeta}>
            Qty: <Text style={styles.bold}>{item.qty}</Text> • Status:{" "}
            <Text style={[styles.bold, item.status === "Low Stock" && { color: "#b45309" }]}>
              {item.status}
            </Text>
          </Text>

          <View style={styles.cardActions}>
            <Pressable style={styles.actionOutline} onPress={() => openEdit(item)}>
              <Text style={styles.actionOutlineText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const FormCard = ({ title, onSave, saveText }) => (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSub}>All fields are inside this card</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Plate"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Qty</Text>
              <TextInput
                value={qty}
                onChangeText={setQty}
                keyboardType="number-pad"
                placeholder="e.g. 10"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Status</Text>
              <TextInput
                value={status}
                onChangeText={setStatus}
                placeholder="Available / Low Stock / Out of Stock"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
            </View>
          </View>

          <Pressable style={styles.btnOutline} onPress={pickImage}>
            <Text style={styles.btnOutlineText}>{pickedImage ? "Change Image" : "Pick Image"}</Text>
          </Pressable>

          {pickedImage?.uri ? (
            <Image source={{ uri: pickedImage.uri }} style={styles.preview} resizeMode="cover" />
          ) : null}

          <Pressable style={[styles.btn, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
            <Text style={styles.btnText}>{saving ? "Saving..." : saveText}</Text>
          </Pressable>

          <Pressable style={styles.btnGhost} onPress={closeModals} disabled={saving}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top card */}
      <View style={styles.topCard}>
        <Text style={styles.title}>Admin Utensils</Text>
        <Text style={styles.sub}>Add + Edit utensils in card modals</Text>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or status..."
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable style={styles.addPill} onPress={openAdd}>
            <Text style={styles.addPillText}>+ Add</Text>
          </Pressable>
        </View>

        <Text style={styles.count}>{filtered.length} item(s)</Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => <UtensilCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No utensils yet</Text>
            <Text style={styles.emptySub}>Tap “Add” to create your first utensil.</Text>
          </View>
        }
      />

      {/* ADD MODAL */}
      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={closeModals}>
        <FormCard title="Add Utensil" onSave={createUtensil} saveText="Add Utensil" />
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEdit} transparent animationType="fade" onRequestClose={closeModals}>
        <FormCard title="Edit Utensil" onSave={updateUtensil} saveText="Save Changes" />
      </Modal>
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.gold },
  sub: { marginTop: 4, color: COLORS.muted, marginBottom: 12 },
  count: { marginTop: 8, color: COLORS.muted, fontWeight: "800", fontSize: 12 },

  label: { fontWeight: "800", color: COLORS.text, marginBottom: 6 },

  input: {
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },

  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },

  addPill: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14
  },
  addPillText: { color: "#fff", fontWeight: "900" },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    overflow: "hidden"
  },
  listImg: { width: "100%", height: 170, backgroundColor: "#eee" },
  noImg: { alignItems: "center", justifyContent: "center" },

  listName: { fontSize: 16, fontWeight: "900", color: COLORS.text },
  listMeta: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  bold: { fontWeight: "900", color: COLORS.goldDark },

  cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionOutline: {
    flex: 1,
    backgroundColor: "#fff3cf",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  actionOutlineText: { color: COLORS.goldDark, fontWeight: "900" },

  empty: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyTitle: { fontWeight: "900", color: COLORS.text, fontSize: 16 },
  emptySub: { marginTop: 4, color: COLORS.muted },

  // MODAL
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 18,
    justifyContent: "center"
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: "85%"
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.gold },
  modalSub: { marginTop: 4, color: COLORS.muted, marginBottom: 12 },

  btnOutline: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: "center"
  },
  btnOutlineText: { color: COLORS.goldDark, fontWeight: "900" },

  preview: { width: "100%", height: 180, borderRadius: 14, marginTop: 12 },

  btn: {
    marginTop: 12,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  btnGhost: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center"
  },
  btnGhostText: { color: COLORS.goldDark, fontWeight: "900" }
});
