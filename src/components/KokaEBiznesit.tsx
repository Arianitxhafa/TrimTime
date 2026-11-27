import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useStilet } from "../context/TemaContext";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import LogoStudio from "./LogoStudio";
import ShiritiIBerberit from "./ShiritiIBerberit";

export type Shifra = { vlera: string; etiketa: string };

type Props = {
  titulli: string;
  // Dy ose tre shifra të shkurtra nën titull (p.sh. termine, të ardhura, klientë VIP).
  shifrat: Shifra[];
};

// Koka e përbashkët e ekraneve të stafit: logoja, titulli i madh, shtylla e berberit dhe shifrat
// e periudhës në karta që hyjnë njëra pas tjetrës.
export default function KokaEBiznesit({ titulli, shifrat }: Props) {
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.koka}>
      <View style={styles.rreshti}>
        <LogoStudio madhesia={44} />
        <Text style={styles.titulli} numberOfLines={1}>
          {titulli}
        </Text>
        <ShiritiIBerberit gjeresia={44} lartesia={6} />
      </View>
      <View style={styles.shifrat}>
        {shifrat.map((s, i) => (
          <Animated.View key={s.etiketa} entering={FadeInDown.delay(90 + i * 70).duration(420)} style={styles.shifra}>
            <Text style={styles.vlera} numberOfLines={1} adjustsFontSizeToFit>
              {s.vlera}
            </Text>
            <Text style={styles.etiketa} numberOfLines={1}>
              {s.etiketa}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    koka: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.md,
      marginBottom: hapesira.md,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    titulli: {
      ...shkronjat.titull,
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 30,
      letterSpacing: -0.8,
      fontWeight: "800",
    },
    shifrat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    shifra: {
      flex: 1,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiri,
      paddingVertical: hapesira.md,
      paddingHorizontal: hapesira.md,
      gap: 2,
    },
    vlera: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 22,
      letterSpacing: -0.4,
      fontVariant: ["tabular-nums"],
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "600",
    },
  });
