import React, { useEffect, useState } from "react";
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
  Keyboard,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { API_URL, APP_SCHEME } from "../config";
import { COLORS } from "../styles/theme";
import { interactivePressable } from "../styles/ui";
import { toast } from "../components/toast";
import PasswordField from "../components/PasswordField";
import logo from "../img/logo.jpg";

WebBrowser.maybeCompleteAuthSession();

function getGoogleRedirectUri() {
  if (Platform.OS === "web") {
    return `${window.location.origin}/google-auth`;
  }

  return ExpoLinking.createURL("google-auth") || `${APP_SCHEME}://google-auth`;
}

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishLogin = async (token, user) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));

    if (user.role === "admin") {
      navigation.reset({ index: 0, routes: [{ name: "AdminTabs" }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: "UserTabs" }] });
    }
  };

  const getQueryParams = (url) => {
    const queryString = String(url || "").split("?")[1] || "";
    return queryString.split("&").reduce((params, pair) => {
      if (!pair) return params;
      const [key, value = ""] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
      return params;
    }, {});
  };

  const handleGoogleRedirect = async (url) => {
    if (!String(url || "").includes("google-auth")) return;

    try {
      setGoogleLoading(true);
      const params = getQueryParams(url);
      if (params.error) {
        toast.error(params.error, "Google sign-in failed");
        return;
      }

      if (!params.token || !params.user) {
        toast.error("Google did not return a valid login session.", "Google sign-in failed");
        return;
      }

      await finishLogin(params.token, JSON.parse(params.user));
    } catch {
      toast.error("Could not complete Google sign-in.", "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => handleGoogleRedirect(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleGoogleRedirect(url);
    });

    return () => subscription.remove();
  }, []);

  const onLogin = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) return toast.error("Enter email and password.", "Missing");

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) return toast.error(data.message || "Try again.", "Login failed");

      await finishLogin(data.token, data.user);
    } catch {
      toast.error("Cannot connect to server. Check API_URL / network.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const appRedirectUri = getGoogleRedirectUri();
      const googleUrl =
        `${API_URL}/api/auth/google/start` +
        `?app_redirect_uri=${encodeURIComponent(appRedirectUri)}` +
        "&direct_redirect=1";

      const result = await WebBrowser.openAuthSessionAsync(googleUrl, appRedirectUri);
      if (result.type === "success" && result.url) {
        await handleGoogleRedirect(result.url);
      } else if (result.type === "cancel" || result.type === "dismiss") {
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Cannot start Google sign-in. Check API_URL / ngrok.");
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brand}>BUKSU HM UTENSILS KITCHEN</Text>
            <Text style={styles.title}>Borrow smarter, return easier.</Text>
            <Text style={styles.sub}>Sign in to manage utensil activity with a cleaner gold-and-white workspace.</Text>
          </View>

          <View style={styles.formWrap}>
            <View style={styles.headerRow}>
              <Text style={styles.formTitle}>Log In</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>SECURE ACCESS</Text>
              </View>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Enter your email"
              placeholderTextColor="#9e947f"
              style={styles.textInput}
            />

            <Text style={[styles.label, styles.labelTop]}>Password</Text>
            <PasswordField
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9e947f"
              style={styles.passwordInput}
            />

            <Pressable
              style={interactivePressable(styles.inlineLink, {
                hoverStyle: styles.inlineLinkHover,
                pressedStyle: styles.inlineLinkPressed,
                hoveredLift: false,
                pressedScale: false
              })}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.inlineLinkText}>Forgot password?</Text>
            </Pressable>

            <Pressable
              style={interactivePressable(styles.primaryAction, {
                hoverStyle: styles.primaryActionHover,
                pressedStyle: styles.primaryActionPressed
              })}
              onPress={onLogin}
              disabled={loading}
            >
              <Text style={styles.primaryActionText}>{loading ? "Signing in..." : "Log In"}</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={interactivePressable(styles.googleAction, {
                hoverStyle: styles.googleActionHover,
                pressedStyle: styles.googleActionPressed
              })}
              onPress={onGoogleLogin}
              disabled={googleLoading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleActionText}>
                {googleLoading ? "Opening Google..." : "Continue with Google"}
              </Text>
            </Pressable>

            <Pressable
              style={interactivePressable(styles.secondaryAction, {
                hoverStyle: styles.secondaryActionHover,
                pressedStyle: styles.secondaryActionPressed
              })}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.secondaryActionText}>Create account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffdf8"
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 34,
    paddingBottom: 40,
    justifyContent: "center"
  },
  glowTop: {
    position: "absolute",
    top: 36,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#fff0bf",
    opacity: 0.75
  },
  glowBottom: {
    position: "absolute",
    bottom: 10,
    left: -46,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#fff7dd"
  },
  hero: {
    alignItems: "center",
    marginBottom: 28
  },
  logoFrame: {
    width: 128,
    height: 128,
    borderRadius: 36,
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
  logo: {
    width: 102,
    height: 76
  },
  brand: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.goldDark,
    letterSpacing: 1
  },
  title: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.text
  },
  sub: {
    marginTop: 10,
    textAlign: "center",
    color: COLORS.muted,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.text
  },
  tag: {
    backgroundColor: "#fff3cc",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#efd68c"
  },
  tagText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.goldDark,
    letterSpacing: 0.7
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 7
  },
  labelTop: {
    marginTop: 16
  },
  textInput: {
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#e9dcc0",
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: COLORS.text,
    fontSize: 15
  },
  passwordInput: {
    backgroundColor: "#fffbef",
    borderWidth: 1,
    borderColor: "#e9dcc0",
    borderRadius: 18,
    minHeight: 56
  },
  inlineLink: {
    alignSelf: "flex-end",
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  inlineLinkHover: {
    backgroundColor: "#fff7df"
  },
  inlineLinkPressed: {
    backgroundColor: "#fff1cc"
  },
  inlineLinkText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.goldDark
  },
  primaryAction: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  primaryActionHover: {
    backgroundColor: "#ffcf35"
  },
  primaryActionPressed: {
    backgroundColor: "#f0bc16"
  },
  primaryActionText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 16
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eadfca"
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  googleAction: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#d8d4ca",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12
  },
  googleActionHover: {
    backgroundColor: "#f8f7f4",
    borderColor: "#c8c2b4"
  },
  googleActionPressed: {
    backgroundColor: "#efede8"
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    backgroundColor: "#f1f3f4",
    color: "#4285f4",
    fontSize: 16,
    fontWeight: "900"
  },
  googleActionText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  },
  secondaryAction: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#eadfca",
    backgroundColor: "#fffdf8",
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center"
  },
  secondaryActionHover: {
    backgroundColor: "#fff8ea",
    borderColor: "#e8d49e"
  },
  secondaryActionPressed: {
    backgroundColor: "#fff2d1"
  },
  secondaryActionText: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15
  }
});
