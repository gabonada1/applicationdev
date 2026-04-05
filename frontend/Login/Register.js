import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Image, StyleSheet } from "react-native";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";
import { COLORS } from "../styles/theme";
import logo from "../img/logo.png";

export default function Register({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e || !password) return Alert.alert("Missing", "Fill up all fields.");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: e, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Register Failed", data.message || "Try again.");

      Alert.alert("Success", "Account created. Please login.");
      navigation.replace("Login");
    } catch {
      Alert.alert("Error", "Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.containerCenter}>
      <View style={styles.hero}>
        <View style={s.badge}>
          <Text style={s.badgeText}>CREATE ACCOUNT</Text>
        </View>
        <View style={s.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={s.heroTitle}>Create Account</Text>
        <Text style={s.heroSub}>Join the system and start managing or borrowing utensils with ease.</Text>
      </View>

      <View style={s.card}>
        <Text style={styles.cardTitle}>Set up your profile</Text>
        <Text style={styles.cardSub}>Use your real details so logs and borrowing history stay accurate.</Text>

        <Text style={s.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={COLORS.muted}
          style={s.input}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@gmail.com / you@student.buksu.edu.ph"
          placeholderTextColor={COLORS.muted}
          style={s.input}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Create a password"
          placeholderTextColor={COLORS.muted}
          style={s.input}
        />

        <Pressable style={s.btn} onPress={onRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Creating..." : "Register"}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={s.back}>Back to login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    marginBottom: 18
  },
  logo: {
    width: 68,
    height: 68
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 6
  },
  cardSub: {
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 6
  }
});
