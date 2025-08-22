// screens/VerifyEmail.tsx
import React, { useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { verifyEmail } from "../backend/api/auth"; // ⬅️ volanie API

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">;

export default function VerifyEmail({ route, navigation }: Props) {
  const { email } = route.params;

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => /^\d{6}$/.test(code) && !busy, [code, busy]);

  const submit = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Kód", "Zadaj 6-miestny kód.");
      return;
    }

    try {
      setBusy(true);
      const res = await verifyEmail(email, code); // { ok, accessToken, user }

      // 🔑 uložiť token pred resetom navigácie
      await AsyncStorage.setItem("accessToken", res.accessToken);

      // reset stack -> Home
      navigation.reset({ index: 0, routes: [{ name: "Home" as never }] });
    } catch (e: any) {
      Alert.alert("Overenie zlyhalo", e.message ?? "Skús to znova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.card}>
        <Text style={s.title}>Overenie e-mailu</Text>
        <Text style={s.sub}>
          Zadaj 6-ciferný kód, ktorý sme poslali na {email}.
        </Text>

        <View style={s.inputWrap}>
          <Text style={s.label}>Overovací kód</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            style={s.input}
            editable={!busy}
          />
        </View>

        <Pressable
          style={[s.primaryBtn, !canSubmit && s.disabled]}
          disabled={!canSubmit}
          onPress={submit}
        >
          <Text style={s.primaryText}>{busy ? "Overujem…" : "Overiť"}</Text>
        </Pressable>

        <View style={s.bottomRow}>
          <Pressable onPress={() => navigation.goBack()} disabled={busy}>
            <Text style={s.link}>Späť</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f1b2b",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#152238",
    padding: 20,
    borderRadius: 20,
  },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  sub: { color: "#9fb0c8", marginTop: 6, marginBottom: 14 },
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
    textAlign: "center",
    letterSpacing: 4,
  },
  primaryBtn: {
    backgroundColor: "#6d5efc",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },
  bottomRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  link: { color: "#8bb7ff", fontWeight: "700" },
});
