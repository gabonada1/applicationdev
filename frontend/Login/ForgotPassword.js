import React, { useMemo, useState } from "react";
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
import { FontAwesome } from "@expo/vector-icons";
import { API_URL } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.jpg";

function StepChip({ index, title, active, done }) {
  return (
    <View style={[styles.stepChip, active && styles.stepChipActive, done && styles.stepChipDone]}>
      <Text style={[styles.stepChipIndex, (active || done) && styles.stepChipIndexActive]}>
        {done ? "OK" : index}
      </Text>
      <Text style={[styles.stepChipTitle, (active || done) && styles.stepChipTitleActive]}>{title}</Text>
    </View>
  );
}

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const passwordReady = newPassword.length >= 6;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const codeLength = code.replace(/[^0-9]/g, "").length;

  const statusText = useMemo(() => {
    if (step === 1) return "We'll send a reset code to your email.";
    if (!passwordReady) return "Use at least 6 characters for the new password.";
    if (!passwordsMatch) return "Confirm the new password to finish safely.";
    return "Everything looks good. You can update the password now.";
  }, [passwordReady, passwordsMatch, step]);

  const requestCode = async () => {
    if (!normalizedEmail) return toast.error("Enter your email.", "Missing");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Try again.");

      toast.info("If the email exists, a code was sent.", "Check your email");
      setStep(2);
    } catch {
      toast.error("Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const cleanCode = code.trim();
    if (!normalizedEmail || !cleanCode || !newPassword || !confirmPassword) {
      return toast.error("Fill all fields.", "Missing");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters.", "Weak password");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match.", "Mismatch");
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code: cleanCode, newPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Try again.");

      toast.success("Password updated. Login now.");
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
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.kicker}>ACCOUNT RECOVERY</Text>
            <Text style={styles.title}>Reset your password with the email code.</Text>
            <Text style={styles.sub}>
              {step === 1
                ? "Enter your email to receive a secure reset code."
                : "Use the code from your inbox, then create a fresh password."}
            </Text>
          </View>

          <View style={styles.stepRow}>
            <StepChip index="1" title="Email" active={step === 1} done={step > 1} />
            <StepChip index="2" title="Reset" active={step === 2} done={false} />
          </View>

          <View style={styles.formWrap}>
            <View style={styles.statusBanner}>
              <View style={styles.statusIconWrap}>
                <FontAwesome name={step === 1 ? "envelope-o" : "shield"} size={18} color={COLORS.goldDark} />
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusTitle}>{step === 1 ? "Send reset code" : "Create new password"}</Text>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@gmail.com"
              placeholderTextColor="#9e947f"
              style={styles.input}
              editable={!loading}
            />

            {step === 1 ? (
              <>
                <View style={styles.tipCard}>
                  <FontAwesome name="lock" size={15} color={COLORS.goldDark} />
                  <Text style={styles.tipText}>The code will be sent only if the account exists.</Text>
                </View>

                <Pressable
                  style={interactivePressable(styles.primaryAction, {
                    hoverStyle: styles.primaryActionHover,
                    pressedStyle: styles.primaryActionPressed
                  })}
                  onPress={requestCode}
                  disabled={loading}
                >
                  <Text style={styles.primaryActionText}>{loading ? "Sending..." : "Send Reset Code"}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.codeSummary}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>Code</Text>
                    <Text style={styles.summaryValue}>{codeLength}/6</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>Password</Text>
                    <Text style={styles.summaryValue}>{passwordReady ? "Ready" : "Too short"}</Text>
                  </View>
                </View>

                <Text style={[styles.label, styles.labelTop]}>Reset Code</Text>
                <TextInput
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor="#9e947f"
                  style={[styles.input, styles.codeInput]}
                  maxLength={6}
                  editable={!loading}
                />

                <Text style={[styles.label, styles.labelTop]}>New Password</Text>
                <PasswordField
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9e947f"
                  style={styles.input}
                  editable={!loading}
                />

                <Text style={[styles.label, styles.labelTop]}>Confirm Password</Text>
                <PasswordField
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  placeholderTextColor="#9e947f"
                  style={styles.input}
                  editable={!loading}
                />

                <View style={styles.checkList}>
                  <View style={styles.checkRow}>
                    <FontAwesome
                      name={passwordReady ? "check-circle" : "circle-thin"}
                      size={16}
                      color={passwordReady ? COLORS.success : COLORS.muted}
                    />
                    <Text style={styles.checkText}>At least 6 characters</Text>
                  </View>
                  <View style={styles.checkRow}>
                    <FontAwesome
                      name={passwordsMatch ? "check-circle" : "circle-thin"}
                      size={16}
                      color={passwordsMatch ? COLORS.success : COLORS.muted}
                    />
                    <Text style={styles.checkText}>Passwords match</Text>
                  </View>
                </View>

                <Pressable
                  style={interactivePressable(styles.primaryAction, {
                    hoverStyle: styles.primaryActionHover,
                    pressedStyle: styles.primaryActionPressed
                  })}
                  onPress={resetPassword}
                  disabled={loading}
                >
                  <Text style={styles.primaryActionText}>{loading ? "Updating..." : "Update Password"}</Text>
                </Pressable>

                <Pressable
                  style={interactivePressable(styles.secondaryAction, {
                    hoverStyle: styles.secondaryActionHover,
                    pressedStyle: styles.secondaryActionPressed
                  })}
                  onPress={() => {
                    setStep(1);
                    setCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={loading}
                >
                  <Text style={styles.secondaryActionText}>Resend Code</Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={interactivePressable(styles.ghostAction, {
                hoverStyle: styles.ghostActionHover,
                pressedStyle: styles.ghostActionPressed,
                hoveredLift: false,
                pressedScale: false
              })}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.ghostActionText}>Back to login</Text>
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
  glowTop: {
    position: "absolute",
    top: 38,
    right: -34,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#fff0bf",
    opacity: 0.7
  },
  glowBottom: {
    position: "absolute",
    bottom: 4,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#fff6d9"
  },
  hero: { alignItems: "center", marginBottom: 22 },
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
  kicker: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.goldDark,
    letterSpacing: 1
  },
  title: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.text,
    maxWidth: 340
  },
  sub: {
    marginTop: 10,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 336
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14
  },
  stepChip: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eadfca",
    backgroundColor: "#fffdf8",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  stepChipActive: {
    backgroundColor: "#fff3cc",
    borderColor: "#efd68c"
  },
  stepChipDone: {
    backgroundColor: "#eefaf0",
    borderColor: "#a5dfb0"
  },
  stepChipIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f3ecde",
    color: COLORS.muted,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900",
    overflow: "hidden",
    paddingTop: Platform.OS === "android" ? 3 : 5
  },
  stepChipIndexActive: {
    backgroundColor: COLORS.gold,
    color: COLORS.text
  },
  stepChipTitle: {
    color: COLORS.muted,
    fontWeight: "800"
  },
  stepChipTitleActive: {
    color: COLORS.text
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
  statusBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#eedfb7",
    borderRadius: 22,
    padding: 14,
    marginBottom: 16
  },
  statusIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff1c7",
    alignItems: "center",
    justifyContent: "center"
  },
  statusCopy: {
    flex: 1
  },
  statusTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  statusText: {
    marginTop: 4,
    color: COLORS.muted,
    lineHeight: 20
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
  codeInput: {
    textAlign: "center",
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: "900"
  },
  tipCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff8ea",
    borderWidth: 1,
    borderColor: "#eedfb7",
    borderRadius: 18,
    padding: 12
  },
  tipText: {
    flex: 1,
    color: COLORS.muted,
    lineHeight: 19
  },
  codeSummary: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "#fff8ea",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eedfb7",
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  summaryValue: {
    marginTop: 6,
    color: COLORS.text,
    fontWeight: "900"
  },
  checkList: {
    marginTop: 14,
    gap: 10
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  checkText: {
    color: COLORS.muted,
    fontWeight: "700"
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
  secondaryActionText: { color: COLORS.text, fontWeight: "900", fontSize: 15 },
  ghostAction: {
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center"
  },
  ghostActionHover: {
    backgroundColor: "#fff8ea"
  },
  ghostActionPressed: {
    backgroundColor: "#fff2d1"
  },
  ghostActionText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  }
});
