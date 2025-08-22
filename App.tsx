import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";

import Onboarding from "./screens/Onboarding";
import Login from "./screens/Login";
import Register from "./screens/Register"; // ✅ fix: správny názov súboru
import ForgotPassword from "./screens/ForgotPassword";
import Forgot from "./screens/ForgotOptions";
import VerifyEmail from "./screens/VerifyEmailAfterRegistration"; // ✅ doplnený import
import VerifyEmailReg from "./screens/VerifyEmail"; // ✅ doplnený import
import Home from "./screens/Home"; // ✅ doplnený import

// --- SETTINGS ---
const ONBOARD_KEY = "has_seen_onboarding_v1";
const FORCE_ONBOARDING = false;
const FORCE_HIDE_SPLASH = false;
const MIN_SPLASH_TIME = 1000;

// --- NAVIGATION TYPES ---
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Forgot: undefined;
  VerifyEmail: { email: string };
  VerifyEmailReg: { email: string }; // pre registráciu
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- PREVENT AUTO HIDE (iba ak nechceme vypnúť splash úplne) ---
if (!FORCE_HIDE_SPLASH) {
  SplashScreen.preventAutoHideAsync();
}

export default function App() {
  const [bootLoading, setBootLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login"); // 👈
  const splashStart = useRef(Date.now());

  const loadFlag = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(ONBOARD_KEY);
      setNeedsOnboarding(v !== "1");

      // 👇 skontroluj prihlásenie
      const t = await AsyncStorage.getItem("accessToken");
      if (t) setInitialRoute("Home");
    } catch {
      setNeedsOnboarding(true);
    } finally {
      setBootLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlag();
  }, [loadFlag]);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, "1");
    setNeedsOnboarding(false);
  }, []);

  // --- skrytie splashu s oneskorením ---
  useEffect(() => {
    if (!bootLoading && !FORCE_HIDE_SPLASH) {
      const elapsed = Date.now() - splashStart.current;
      const remaining = Math.max(0, MIN_SPLASH_TIME - elapsed);
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [bootLoading]);

  // --- LOGIKA ---
  if (FORCE_ONBOARDING) {
    return <Onboarding onDone={() => {}} />;
  }

  if (bootLoading || needsOnboarding === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.mt}>Loading…</Text>
      </View>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onDone={finishOnboarding} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute} //
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Forgot" component={Forgot} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
        <Stack.Screen name="VerifyEmailReg" component={VerifyEmailReg} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  mt: { marginTop: 16, fontSize: 16 },
});
