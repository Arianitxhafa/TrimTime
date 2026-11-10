import { StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Emri i aplikacionit: gërshërë ari dhe "TrimTime" me SF Pro.
export default function Marka({ madhesia = 30 }: { madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.marka} accessibilityRole="header" accessibilityLabel="TrimTime">
      <Ikona emri={ikonat.gershere} madhesia={Math.round(madhesia * 0.62)} ngjyra={ngjyrat.bronzi} />
      <Text style={[styles.emri, { color: ngjyrat.teksti, fontSize: madhesia, lineHeight: madhesia * 1.2 }]}>
        TrimTime
      </Text>
    </View>
  );
}

// Mbetet që ekranet ekzistuese të mos ndryshojnë; në stilin e Apple koka e ekranit është e pastër.
export function Drita(_props: { lartesia?: number }) {
  return null;
}

const styles = StyleSheet.create({
  marka: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emri: {
    ...shkronjat.titull,
    letterSpacing: -0.6,
  },
});
