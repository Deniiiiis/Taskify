import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../backend/api/auth";

type Props = { navigation?: any };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [loading, setLoading] = useState(false); // 👈 pridané

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Chýbajú údaje", "Zadaj e-mail aj heslo.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email.toLowerCase().trim(), password.trim());
      // očakávaný tvar: { ok, user, accessToken, refreshToken }
      await AsyncStorage.setItem("accessToken", res.accessToken);
      await AsyncStorage.setItem("refreshToken", res.refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(res.user));
      await AsyncStorage.setItem("staySignedIn", staySignedIn ? "1" : "0");

      navigation?.replace?.("Home");
    } catch (e: any) {
      Alert.alert("Login zlyhal", e?.message ?? "Skús znova.");
    } finally {
      setLoading(false);
    }
  };

  const onForgot = () => navigation?.navigate?.("ForgotPassword");
  const goRegister = () => navigation?.navigate?.("Register");

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.wrap}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View style={s.card}>
          {/* Logo */}
          <View style={s.logoWrap}>
            {/* replace with your logo image */}
            <View style={s.logo}>
              <Text style={s.logoTick}>✓</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={s.title}>Welcome to Taskify 👋</Text>

          {/* Email */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tvoj@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={s.input}
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={s.inputWrap}>
            <Text style={s.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={s.input}
              editable={!loading}
            />
          </View>

          {/* Stay signed in + Forgot */}
          <View style={s.rowBetween}>
            <Pressable
              style={s.checkRow}
              onPress={() => !loading && setStaySignedIn((v) => !v)}
            >
              <View style={[s.checkbox, staySignedIn && s.checkboxOn]}>
                {staySignedIn ? <Text style={s.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={s.checkLabel}>Zostať prihlásený</Text>
            </Pressable>

            <Pressable hitSlop={8} onPress={onForgot} disabled={loading}>
              <Text style={s.link}>Zabudol som heslo?</Text>
            </Pressable>
          </View>

          {/* Login button */}
          <Pressable
            style={[s.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={s.primaryText}>Prihlásiť sa</Text>
            )}
          </Pressable>

          {/* OR divider */}
          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.divider} />
          </View>

          {/* Google */}
          <Pressable
            style={[s.oauthBtn, s.googleBtn]}
            onPress={() => {}}
            disabled={loading}
          >
            <Text style={s.oauthText}>Sign in with Google</Text>
          </Pressable>

          {/* Apple */}
          <Pressable
            style={[s.oauthBtn, s.appleBtn]}
            onPress={() => {}}
            disabled={loading}
          >
            <Text style={[s.oauthText, s.appleText]}>Sign in with Apple</Text>
          </Pressable>

          {/* Bottom link */}
          <View style={s.bottomRow}>
            <Text style={s.muted}>Nemáš účet? </Text>
            <Pressable onPress={goRegister} disabled={loading}>
              <Text style={s.linkStrong}>Registruj sa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1b2b" }, // background – kľudne zmeň
  wrap: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#152238",
    padding: 20,
    borderRadius: 20,
  },

  logoWrap: { alignItems: "center", marginBottom: 16 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  logoTick: { color: "white", fontSize: 34, fontWeight: "700" },

  title: {
    textAlign: "center",
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },

  inputWrap: { marginBottom: 12 },
  label: { color: "#9fb0c8", marginBottom: 6, fontSize: 13 },
  input: {
    backgroundColor: "#0e1726",
    borderWidth: 1,
    borderColor: "#23324a",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
    fontSize: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },

  checkRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#5b6b84",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  checkboxMark: { color: "white", fontSize: 12, fontWeight: "700" },
  checkLabel: { color: "#c7d2e5", fontSize: 13 },

  primaryBtn: {
    backgroundColor: "#6d5efc",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#23324a" },
  dividerText: { marginHorizontal: 10, color: "#9fb0c8", fontSize: 12 },

  oauthBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#23324a",
    marginBottom: 10,
    backgroundColor: "#0e1726",
  },
  googleBtn: {},
  appleBtn: { backgroundColor: "#111316" },
  oauthText: { color: "white", fontSize: 15, fontWeight: "600" },
  appleText: { color: "white" },

  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  muted: { color: "#9fb0c8" },
  link: { color: "#8bb7ff" },
  linkStrong: { color: "#8bb7ff", fontWeight: "700" },
});
