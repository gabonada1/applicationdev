import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  FlatList,
  RefreshControl,
  StyleSheet,
  Modal,
  ScrollView,
  Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";

function derivedStatus(qtyValue) {
  const value = Number(qtyValue) || 0;
  if (value <= 0) return "Out of Stock";
  if (value <= 10) return "Low Stock";
  return "Available";
}

function FormCard({
  title,
  onSave,
  saveText,
  closeModals,
  saving,
  name,
  setName,
  qty,
  setQty,
  pickedImage,
  pickImage
}) {
  return (
    <View style={styles.modalRoot}>
      <Pressable style={styles.backdrop} onPress={closeModals} />

      <View style={styles.modalCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingBottom: 18 }}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSub}>Name, quantity, and image are managed here.</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Plate"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <View style={{ marginTop: 12 }}>
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

          <View style={styles.autoStatusBox}>
            <Text style={styles.autoStatusLabel}>Status</Text>
            <Text style={styles.autoStatusValue}>{derivedStatus(qty)}</Text>
            <Text style={styles.autoStatusHint}>Automatically based on quantity.</Text>
          </View>

          <Pressable
            style={interactivePressable(styles.btnOutline, {
              hoverStyle: styles.btnOutlineHover,
              pressedStyle: styles.btnOutlinePressed
            })}
            onPress={pickImage}
          >
            <Text style={styles.btnOutlineText}>
              {pickedImage?.uri ? "Change Image" : "Pick Image"}
            </Text>
          </Pressable>

          {pickedImage?.uri ? (
            <Image source={{ uri: pickedImage.uri }} style={styles.preview} resizeMode="cover" />
          ) : null}

          <Pressable
            style={({ pressed, hovered }) => [
              styles.btn,
              saving && { opacity: 0.6 },
              hovered && !saving && styles.btnHover,
              pressed && !saving && styles.btnPressed
            ]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.btnText}>{saving ? "Saving..." : saveText}</Text>
          </Pressable>

          <Pressable
            style={interactivePressable(styles.btnGhost, {
              hoverStyle: styles.btnGhostHover,
              pressedStyle: styles.btnGhostPressed
            })}
            onPress={closeModals}
            disabled={saving}
          >
            <Text style={styles.btnGhostText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

export default function AdminUtensils() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [formId, setFormId] = useState(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [pickedImage, setPickedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [imgVersion, setImgVersion] = useState(Date.now());

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
    setPickedImage(null);
  };

  const closeModals = () => {
    setShowAdd(false);
    setShowEdit(false);
    resetForm();
  };

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const openEdit = (item) => {
    setFormId(item._id);
    setName(item.name || "");
    setQty(String(item.qty ?? 1));

    if (item.hasImage) {
      setPickedImage({ uri: `${API_URL}/api/utensils/${item._id}/image?ts=${Date.now()}` });
    } else {
      setPickedImage(null);
    }

    setShowEdit(true);
  };

  const pickImage = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error("Please allow photo access.", "Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // THIS works for your version
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }

  } catch (error) {
    toast.error(error.message, "Image picker error");
  }
};


  const buildFormData = () => {
    const form = new FormData();
    form.append("name", name.trim());
    form.append("qty", String(Number(qty)));

    if (pickedImage?.uri && String(pickedImage.uri).startsWith("file")) {
      const ext = (pickedImage.uri.split(".").pop() || "jpg").toLowerCase();
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
    if (!name.trim()) return toast.error("Enter utensil name.", "Missing");
    if (!qty || isNaN(Number(qty)) || Number(qty) < 0) return toast.error("Qty must be 0 or more.", "Invalid");

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Missing token. Please login again.");

      const res = await fetch(`${API_URL}/api/utensils`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData()
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Could not add utensil.", "Failed");

      toast.success("Utensil added!");
      setImgVersion(Date.now());
      closeModals();
      load();
    } catch {
      toast.error("Network/server error.");
    } finally {
      setSaving(false);
    }
  };

  const updateUtensil = async () => {
    if (!formId) return;
    if (!name.trim()) return toast.error("Enter utensil name.", "Missing");
    if (!qty || isNaN(Number(qty)) || Number(qty) < 0) return toast.error("Qty must be 0 or more.", "Invalid");

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Missing token. Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${formId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData()
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Could not update utensil.", "Failed");

      toast.success("Utensil updated!");
      setImgVersion(Date.now());
      closeModals();
      load();
    } catch {
      toast.error("Network/server error.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUtensil = async (item) => {
    try {
      setDeletingId(item._id);
      const token = await AsyncStorage.getItem("token");
      if (!token) return toast.error("Missing token. Please login again.");

      const res = await fetch(`${API_URL}/api/utensils/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        return toast.error(data.message || "Could not delete utensil.", "Delete failed");
      }

      toast.success("Utensil deleted.");
      await load();
    } catch {
      toast.error("Network/server error.");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      "Delete utensil?",
      `Remove ${item.name}? This is blocked if there are active borrowed records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteUtensil(item)
        }
      ]
    );
  };

  const UtensilCard = ({ item }) => {
    const imgUri = item.hasImage ? `${API_URL}/api/utensils/${item._id}/image?ts=${imgVersion}` : null;
    const isDeleting = deletingId === item._id;

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
            Qty: <Text style={styles.bold}>{item.qty}</Text> | Status:{" "}
            <Text style={[styles.bold, item.status === "Low Stock" && { color: "#b45309" }]}>
              {item.status}
            </Text>
          </Text>

          <View style={styles.cardActions}>
            <Pressable
              style={interactivePressable(styles.actionOutline, {
                hoverStyle: styles.actionOutlineHover,
                pressedStyle: styles.actionOutlinePressed
              })}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.actionOutlineText}>Edit</Text>
            </Pressable>

            <Pressable
              style={({ pressed, hovered }) => [
                styles.actionDanger,
                isDeleting && styles.actionDisabled,
                hovered && !isDeleting && styles.actionDangerHover,
                pressed && !isDeleting && styles.actionDangerPressed
              ]}
              onPress={() => confirmDelete(item)}
              disabled={isDeleting}
            >
              <Text style={styles.actionDangerText}>{isDeleting ? "Deleting..." : "Delete"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
          <Pressable
            style={interactivePressable(styles.addPill, {
              hoverStyle: styles.addPillHover,
              pressedStyle: styles.addPillPressed
            })}
            onPress={openAdd}
          >
            <Text style={styles.addPillText}>+ Add</Text>
          </Pressable>
        </View>

        <Text style={styles.count}>{filtered.length} item(s)</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => <UtensilCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showAdd}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeModals}
      >
        <FormCard
          title="Add Utensil"
          onSave={createUtensil}
          saveText="Add Utensil"
          closeModals={closeModals}
          saving={saving}
          name={name}
          setName={setName}
          qty={qty}
          setQty={setQty}
          pickedImage={pickedImage}
          pickImage={pickImage}
        />
      </Modal>

      <Modal
        visible={showEdit}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={closeModals}
      >
        <FormCard
          title="Edit Utensil"
          onSave={updateUtensil}
          saveText="Save Changes"
          closeModals={closeModals}
          saving={saving}
          name={name}
          setName={setName}
          qty={qty}
          setQty={setQty}
          pickedImage={pickedImage}
          pickImage={pickImage}
        />
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
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: "#e7dcc6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text
  },

  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addPill: { backgroundColor: COLORS.gold, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  addPillHover: { backgroundColor: "#ffcf35" },
  addPillPressed: { backgroundColor: "#f0bc16" },
  addPillText: { color: COLORS.text, fontWeight: "900" },

  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#eadfca",
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
  actionOutlineHover: { backgroundColor: "#ffefbf", borderColor: "#e8d49e" },
  actionOutlinePressed: { backgroundColor: "#ffe9a8" },
  actionOutlineText: { color: COLORS.goldDark, fontWeight: "900" },
  actionDanger: {
    flex: 1,
    backgroundColor: "#fff1ee",
    borderWidth: 1,
    borderColor: "#ffb7a8",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  actionDangerHover: { backgroundColor: "#ffe8e3", borderColor: "#ff9c89" },
  actionDangerPressed: { backgroundColor: "#ffdbd3" },
  actionDangerText: { color: COLORS.warning, fontWeight: "900" },
  actionDisabled: { opacity: 0.6 },

  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 0
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadfca",
    maxHeight: "85%",
    zIndex: 10,
    elevation: 20
  },

  modalTitle: { fontSize: 18, fontWeight: "900", color: COLORS.gold },
  modalSub: { marginTop: 4, color: COLORS.muted, marginBottom: 12 },

  btnOutline: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfca",
    alignItems: "center"
  },
  btnOutlineHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  btnOutlinePressed: { backgroundColor: "#fff2d1" },
  btnOutlineText: { color: COLORS.goldDark, fontWeight: "900" },

  preview: { width: "100%", height: 180, borderRadius: 14, marginTop: 12 },
  autoStatusBox: {
    marginTop: 14,
    backgroundColor: "#fff8ea",
    borderWidth: 1,
    borderColor: "#eadfca",
    borderRadius: 16,
    padding: 14
  },
  autoStatusLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  autoStatusValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text
  },
  autoStatusHint: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12
  },

  btn: { marginTop: 12, backgroundColor: COLORS.gold, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  btnHover: { backgroundColor: "#ffcf35" },
  btnPressed: { backgroundColor: "#f0bc16" },
  btnText: { color: COLORS.text, fontWeight: "900", fontSize: 16 },

  btnGhost: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfca",
    alignItems: "center"
  },
  btnGhostHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  btnGhostPressed: { backgroundColor: "#fff2d1" },
  btnGhostText: { color: COLORS.goldDark, fontWeight: "900" }
});
