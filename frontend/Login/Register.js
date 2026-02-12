import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";

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
      <View style={s.card}>
        <Text style={s.header}>Create Account</Text>
        <Text style={s.sub}>Gold & White enrollment</Text>

        <Text style={s.label}>Full Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#6b7280" style={s.input} />

        <Text style={[s.label, { marginTop: 12 }]}>Email</Text>
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
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Create a password" placeholderTextColor="#6b7280" style={s.input} />

        <Pressable style={s.btn} onPress={onRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Creating..." : "Register"}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back to login</Text>
        </Pressable>
      </View>
    </View>
  );
}
