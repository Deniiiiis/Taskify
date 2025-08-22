import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../backend/api/src/config";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../backend/api/http";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<string>("");
  const navigation = useNavigation();

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/health");
      const data = await res.json().catch(() => null);
      setHealth(data?.ok ? `✅ OK – ${data.ts}` : "⚠️ API neodpovedá");
    } catch {
      setHealth("⚠️ API neodpovedá");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    Alert.alert("Odhlásený", "Bol si odhlásený.");
    navigation.reset({ index: 0, routes: [{ name: "Login" as never }] });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0f1b2b" }}
      refreshControl={
        <RefreshControl
          tintColor="#fff"
          refreshing={loading}
          onRefresh={load}
        />
      }
      contentContainerStyle={s.wrap}
    >
      <Text style={s.title}>Taskify – Home</Text>

      <View style={s.card}>
        <Text style={s.label}>Backend status</Text>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.value}>{health}</Text>
        )}
      </View>

      <Pressable style={s.primaryBtn} onPress={load} disabled={loading}>
        <Text style={s.primaryText}>{loading ? "Načítavam…" : "Obnoviť"}</Text>
      </Pressable>

      <Pressable style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Odhlásiť sa</Text>
      </Pressable>

      <Text style={s.hint}>Skip Skip Skip Skip Skip Skip Skip oooooo</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#152238",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#23324a",
  },
  label: { color: "#9fb0c8", marginBottom: 6 },
  value: { color: "white", fontWeight: "700" },
  primaryBtn: {
    backgroundColor: "#6d5efc",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "#ff5c5c",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: { color: "white", fontSize: 16, fontWeight: "700" },
  hint: { color: "#9fb0c8", textAlign: "center" },
});
