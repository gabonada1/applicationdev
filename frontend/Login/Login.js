import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";
import { COLORS } from "../styles/theme";
import logo from "../img/logo.png";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) return Alert.alert("Missing", "Enter email and password.");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Login failed", data.message || "Try again.");

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigation.reset({ index: 0, routes: [{ name: "AdminTabs" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "UserTabs" }] });
      }
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
          <Text style={s.badgeText}>SMART INVENTORY</Text>
        </View>
        <View style={s.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={s.heroTitle}>HM Kitchen</Text>
        <Text style={s.heroSub}>Track utensils, view stock quickly, and keep borrowing simple.</Text>
      </View>

      <View style={s.card}>
        <Text style={styles.cardTitle}>Welcome back</Text>
        <Text style={styles.cardSub}>Sign in to continue to your kitchen inventory dashboard.</Text>

        <Text style={[s.label, { marginTop: 18 }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          placeholderTextColor={COLORS.muted}
          style={s.input}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter your password"
          placeholderTextColor={COLORS.muted}
          style={s.input}
        />

        <Pressable style={s.btn} onPress={onLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Signing in..." : "Login"}</Text>
        </Pressable>

        <View style={s.rowBetween}>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={s.link}>Create account</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={s.link}>Forgot password?</Text>
          </Pressable>
        </View>
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
    width: 74,
    height: 74
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.text
  },
  cardSub: {
    marginTop: 6,
    color: COLORS.muted,
    lineHeight: 20
  }
});
