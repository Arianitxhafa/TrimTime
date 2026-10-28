import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { hapesira, hijet } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Logo e TrimTime: gërshërë mbi gradient ari, me emrin pranë.
export default function Marka({ madhesia = 42 }: { madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.marka}>
      <LinearGradient
        colors={ngjyrat.gradientiAri}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logo, hijet.ari, { width: madhesia, height: madhesia, borderRadius: madhesia * 0.3 }]}
      >
        <Ikona emri={ikonat.gershere} madhesia={madhesia * 0.52} ngjyra={ngjyrat.mbiAri} />
      </LinearGradient>
      <Text style={[styles.emri, { color: ngjyrat.teksti }]}>TrimTime</Text>
    </View>
  );
}

// Drita e artë e butë në krye të ekraneve kryesore.
export function Drita({ lartesia = 340 }: { lartesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <LinearGradient
      colors={[ngjyrat.ariIErret, ngjyrat.sfondi]}
      style={[styles.drita, { height: lartesia }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  marka: {
    flexDirection: "row",
    alignItems: "center",
    gap: hapesira.md,
  },
  logo: {
    alignItems: "center",
    justifyContent: "center",
  },
  emri: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  drita: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
