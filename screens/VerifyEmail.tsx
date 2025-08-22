import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { verifyEmail, resendVerifyEmail } from "../backend/api/auth";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmailReg">;

export default function VerifyEmailReg({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert("Kód", "Zadaj 6-miestny kód.");
      return;
    }
    try {
      setBusy(true);
      await verifyEmail(email, code);
      // po úspechu poď na Home (alebo Login, podľa tvojej logiky)
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      Alert.alert("Overenie zlyhalo", e.message ?? "Skús to znova.");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    try {
      setBusy(true);
      await resendVerifyEmail(email);
      Alert.alert("Poslané", "Nový kód sme poslali na tvoj e-mail.");
    } catch (e: any) {
      Alert.alert("Chyba", e.message ?? "Skús to znova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Overenie e-mailu</Text>
      <Text style={s.subtitle}>Poslali sme kód na {email}</Text>

      <TextInput
        style={s.input}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      <Pressable
        style={[s.btn, busy && s.disabled]}
        onPress={onVerify}
        disabled={busy}
      >
        <Text style={s.btnText}>{busy ? "Overujem…" : "Potvrdiť"}</Text>
      </Pressable>

      <Pressable onPress={onResend} disabled={busy} style={{ marginTop: 12 }}>
        <Text style={{ color: "#8bb7ff", textAlign: "center" }}>
          Poslať kód znova
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0f1b2b",
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { color: "#9fb0c8", textAlign: "center", marginBottom: 16 },
  input: {
    backgroundColor: "#0e1726",
    borderWidth: 1,
    borderColor: "#23324a",
    borderRadius: 12,
    padding: 12,
    color: "white",
    fontSize: 20,
    letterSpacing: 4,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#6d5efc",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
