import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";

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
  navigation.reset({
    index: 0,
    routes: [{ name: "AdminTabs" }]
  });
} else {
  navigation.reset({
    index: 0,
    routes: [{ name: "UserTabs" }]
  });
}

    } catch {
      Alert.alert("Error", "Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.containerCenter}>
      <View style={{ marginBottom: 14 }}>
        <Text style={s.heroTitle}>APPLICATIONDEV</Text>
        <Text style={s.heroSub}>Gold & White Access Portal</Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@gmail.com / you@student.buksu.edu.ph"
          placeholderTextColor="#6b7280"
          style={s.input}
        />

        <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#6b7280"
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

        <Text style={{ marginTop: 12, color: "#6b7280", fontSize: 12, textAlign: "center" }}>
          Gmail = User • student.buksu.edu.ph = Admin
        </Text>
      </View>
    </View>
  );
}
