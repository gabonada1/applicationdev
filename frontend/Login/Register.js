import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.jpg";

export default function Register({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e || !password) return toast.error("Fill up all fields.", "Missing");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: e, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Try again.", "Register failed");

      toast.success("Account created. Please login.");
      navigation.replace("Login");
    } catch {
      toast.error("Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.sub}>Join the system with the same calm gold-and-white experience across every screen.</Text>
          </View>

          <View style={styles.formWrap}>
            <Text style={styles.label}>Full name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#9e947f" style={styles.input} />

            <Text style={[styles.label, styles.labelTop]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@gmail.com"
              placeholderTextColor="#9e947f"
              style={styles.input}
            />

            <Text style={[styles.label, styles.labelTop]}>Password</Text>
            <PasswordField
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              placeholderTextColor="#9e947f"
              style={styles.input}
            />

            <Pressable
              style={interactivePressable(styles.primaryAction, {
                hoverStyle: styles.primaryActionHover,
                pressedStyle: styles.primaryActionPressed
              })}
              onPress={onRegister}
              disabled={loading}
            >
              <Text style={styles.primaryActionText}>{loading ? "Creating..." : "Create Account"}</Text>
            </Pressable>

            <Pressable
              style={interactivePressable(styles.secondaryAction, {
                hoverStyle: styles.secondaryActionHover,
                pressedStyle: styles.secondaryActionPressed
              })}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryActionText}>Back to login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffdf8" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 40,
    justifyContent: "center"
  },
  hero: { alignItems: "center", marginBottom: 26 },
  logoFrame: {
    width: 118,
    height: 118,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#f0e1c1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  logo: { width: 96, height: 70 },
  title: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.text
  },
  sub: {
    marginTop: 10,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 330
  },
  formWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: "#eadfca",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  label: { fontSize: 13, fontWeight: "900", color: COLORS.text, marginBottom: 7 },
  labelTop: { marginTop: 16 },
  input: {
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#e9dcc0",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: COLORS.text,
    fontSize: 15
  },
  primaryAction: {
    marginTop: 18,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center"
  },
  primaryActionHover: { backgroundColor: "#ffcf35" },
  primaryActionPressed: { backgroundColor: "#f0bc16" },
  primaryActionText: { color: COLORS.text, fontWeight: "900", fontSize: 16 },
  secondaryAction: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#eadfca",
    backgroundColor: "#fffdf8",
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center"
  },
  secondaryActionHover: { backgroundColor: "#fff8ea", borderColor: "#e8d49e" },
  secondaryActionPressed: { backgroundColor: "#fff2d1" },
  secondaryActionText: { color: COLORS.text, fontWeight: "900", fontSize: 15 }
});
