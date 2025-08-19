import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";

const { width } = Dimensions.get("window");

const slides = [
  { key: "one", title: "Vitaj v Taskify", text: "AI asistované úlohy", bg: "#4F46E5" },
  { key: "two", title: "Maj poriadok", text: "Všetko na jednom mieste", bg: "#0EA5E9" },
  { key: "three", title: "Smart pripomienky", text: "Už nič nezabudneš", bg: "#22C55E" },
  { key: "four", title: "Podľa lokácie", text: "Upozorníme ťa na mieste", bg: "#F59E0B" },
  { key: "five", title: "Poďme na to!", text: "Prihlás sa a začni tvoriť", bg: "#A855F7" },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <AppIntroSlider
      data={slides}
      onDone={onDone}
      showSkipButton
      renderItem={({ item }) => (
        <View style={[styles.slide, { backgroundColor: item.bg }]}>
          <Image  style={styles.image} />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  image: { width: width * 0.6, height: width * 0.6, resizeMode: "contain", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 8 },
  text: { fontSize: 16, color: "#fff", textAlign: "center", opacity: 0.9 },
});
