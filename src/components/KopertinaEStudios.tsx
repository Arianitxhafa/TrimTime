import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../context/TemaContext";
import { FOTO_E_LOKALIT } from "../lib/studio";
import { hapesira } from "../theme";
import LogoStudio from "./LogoStudio";
import ShiritiIBerberit from "./ShiritiIBerberit";

type Props = {
  lartesia: number;
  // Emri, qyteti dhe statusi, sipër fotos.
  children: ReactNode;
};

// Kopertina e Studio Burimit: fotoja e lokalit, me logon dhe shtyllën e berberit sipër. E palëvizshme.
export default function KopertinaEStudios({ lartesia, children }: Props) {
  const { ngjyrat } = useTema();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.kopertina, { height: lartesia }]}>
      <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" />

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0)", "rgba(0,0,0,0.35)", ngjyrat.sfondi]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.permbajtja, { paddingTop: insets.top + 56 }]}>
        <LogoStudio madhesia={84} />
        <View style={styles.hapesire} />
        {children}
        <View style={styles.shtylla}>
          <ShiritiIBerberit gjeresia={96} lartesia={8} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kopertina: {
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
  },
  permbajtja: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: hapesira.xl,
    paddingBottom: hapesira.xl,
  },
  hapesire: {
    flex: 1,
  },
  shtylla: {
    marginTop: hapesira.lg,
  },
});
