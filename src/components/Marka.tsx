import { StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { EMRI_I_STUDIOS } from "../lib/studio";
import { shkronjat } from "../theme";
import LogoStudio from "./LogoStudio";

// Logoja e Studio Burimit dhe emri me SF Pro.
export default function Marka({ madhesia = 30 }: { madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.marka} accessibilityRole="header" accessibilityLabel={EMRI_I_STUDIOS}>
      <LogoStudio madhesia={Math.round(madhesia * 1.5)} />
      <Text style={[styles.emri, { color: ngjyrat.teksti, fontSize: madhesia, lineHeight: madhesia * 1.2 }]}>
        {EMRI_I_STUDIOS}
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
