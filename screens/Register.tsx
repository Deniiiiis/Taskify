import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { register as apiRegister } from "../backend/api/auth"; // ⬅️ správna cesta

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function Register({ navigation }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      /\S+@\S+\.\S+/.test(email) &&
      password.length >= 8 &&
      password === confirm &&
      !busy
    );
  }, [name, email, password, confirm, busy]);

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Skontroluj údaje",
        "Zadaj meno, platný e-mail a rovnaké heslá (min. 8 znakov)."
      );
      return;
    }

    try {
      setBusy(true);
      await apiRegister(name.trim(), email.trim().toLowerCase(), password);
      navigation.navigate("VerifyEmail", { email: email.trim().toLowerCase() });
    } catch (err: any) {
      Alert.alert("Registrácia zlyhala", err?.message ?? "Skús to znova.");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = () => {};
  const onApple = () => {};

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.wrap}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <Text style={s.title}>Vytvor účet</Text>

          <View style={s.inputWrap}>
            <Text style={s.label}>Meno</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tvoje meno"
              style={s.input}
              editable={!busy}
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="tvoj@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={s.input}
              editable={!busy}
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Heslo</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={s.input}
              editable={!busy}
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Potvrdiť heslo</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry
              style={s.input}
              editable={!busy}
            />
          </View>

          <Pressable
            style={[s.primaryBtn, !canSubmit && s.disabled]}
            onPress={onSubmit}
            disabled={!canSubmit}
          >
            <Text style={s.primaryText}>
              {busy ? "Vytváram…" : "Vytvoriť účet"}
            </Text>
          </Pressable>

          <View style={s.dividerRow}>
            <View style={s.divider} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.divider} />
          </View>

          <Pressable
            style={[s.oauthBtn, s.googleBtn]}
            onPress={onGoogle}
            disabled={busy}
          >
            <Text style={s.oauthText}>Sign up with Google</Text>
          </Pressable>

          <Pressable
            style={[s.oauthBtn, s.appleBtn]}
            onPress={onApple}
            disabled={busy || (Platform.OS !== "ios" && false)}
          >
            <Text style={[s.oauthText, s.appleText]}>Sign up with Apple</Text>
          </Pressable>

          <View style={s.bottomRow}>
            <Text style={s.muted}>Máš účet? </Text>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              disabled={busy}
            >
              <Text style={s.linkStrong}>Prihlás sa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f1b2b" },
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
  primaryBtn: {
    backgroundColor: "#6d5efc",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
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
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  muted: { color: "#9fb0c8" },
  linkStrong: { color: "#8bb7ff", fontWeight: "700" },
});
