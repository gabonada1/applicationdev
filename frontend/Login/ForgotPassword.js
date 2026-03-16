import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Image } from "react-native";
import { API_URL } from "../config";
import { commonStyles as s } from "../styles/commonStyles";
import logo from "../img/logo.png";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return Alert.alert("Missing", "Enter your email.");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Error", data.message || "Try again.");

      Alert.alert("Check", "If the email exists, a code was sent. (Or check backend console if SMTP not set)");
      setStep(2);
    } catch {
      Alert.alert("Error", "Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !code.trim() || !newPassword) return Alert.alert("Missing", "Fill all fields.");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, code: code.trim(), newPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return Alert.alert("Error", data.message || "Try again.");

      Alert.alert("Success", "Password updated. Login now.");
      navigation.replace("Login");
    } catch {
      Alert.alert("Error", "Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.containerCenter}>
      {/* LOGO */}
      <View style={{ alignItems: "center", marginBottom: 14 }}>
        <Image source={logo} style={{ width: 140, height: 140 }} resizeMode="contain" />
        <Text style={s.heroTitle}>Reset Password</Text>
        <Text style={s.heroSub}>Gold & White security</Text>
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

        {step === 1 ? (
          <Pressable style={s.btn} onPress={requestCode} disabled={loading}>
            <Text style={s.btnText}>{loading ? "Sending..." : "Send code"}</Text>
          </Pressable>
        ) : (
          <>
            <Text style={[s.label, { marginTop: 12 }]}>Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="6-digit code"
              placeholderTextColor="#6b7280"
              style={s.input}
            />

            <Text style={[s.label, { marginTop: 12 }]}>New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="New password"
              placeholderTextColor="#6b7280"
              style={s.input}
            />

            <Pressable style={s.btn} onPress={resetPassword} disabled={loading}>
              <Text style={s.btnText}>{loading ? "Updating..." : "Reset password"}</Text>
            </Pressable>

            <Pressable onPress={() => setStep(1)}>
              <Text style={s.back}>Resend code</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
