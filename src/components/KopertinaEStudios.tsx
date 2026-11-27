import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTema } from "../context/TemaContext";
import { FOTOT_E_STUDIOS } from "../lib/studio";
import { hapesira } from "../theme";
import LogoStudio from "./LogoStudio";
import ShiritiIBerberit from "./ShiritiIBerberit";

const KOHA_E_FOTOS = 4200;

type Props = {
  // Lëvizja e listës: kopertina ngrihet më ngadalë (paralaks) dhe zmadhohet kur tërhiqet poshtë.
  scrollY: SharedValue<number>;
  lartesia: number;
  // Emri, qyteti dhe statusi, sipër fotove.
  children: ReactNode;
};

// Kopertina e Studio Burimit: punimet e Studios ndërrohen vetë me zbehje dhe zmadhim të ngadaltë
// (Ken Burns), me logon dhe shtyllën e berberit sipër.
export default function KopertinaEStudios({ scrollY, lartesia, children }: Props) {
  const { ngjyrat } = useTema();
  const insets = useSafeAreaInsets();
  const [indeksi, setIndeksi] = useState(0);

  useEffect(() => {
    const kohematesi = setInterval(() => setIndeksi((i) => (i + 1) % FOTOT_E_STUDIOS.length), KOHA_E_FOTOS);
    return () => clearInterval(kohematesi);
  }, []);

  const stiliIFotove = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y > 0 ? y * 0.45 : y / 2 },
        { scale: interpolate(y, [-240, 0], [1.45, 1], Extrapolation.CLAMP) },
      ],
    };
  });
  const stiliIPermbajtjes = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, lartesia * 0.55], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [0, lartesia], [0, -40], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={[styles.kopertina, { height: lartesia }]}>
      <Animated.View style={[StyleSheet.absoluteFill, stiliIFotove]}>
        {/* `key` e rinis foton: e reja hyn me zbehje, e vjetra del me zbehje. */}
        <Animated.View key={indeksi} entering={FadeIn.duration(1100)} exiting={FadeOut.duration(1100)} style={StyleSheet.absoluteFill}>
          <FotoQeZmadhohet burimi={FOTOT_E_STUDIOS[indeksi]} />
        </Animated.View>
      </Animated.View>

      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0)", "rgba(0,0,0,0.35)", ngjyrat.sfondi]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.permbajtja, { paddingTop: insets.top + 56 }, stiliIPermbajtjes]}>
        <LogoStudio madhesia={84} />
        <View style={styles.hapesire} />
        <Animated.View entering={FadeInDown.delay(220).duration(500)}>{children}</Animated.View>
        <View style={styles.shtylla}>
          <ShiritiIBerberit gjeresia={96} lartesia={8} />
          <View style={styles.pikat}>
            {FOTOT_E_STUDIOS.map((_, i) => (
              <View key={i} style={[styles.pika, i === indeksi && styles.pikaAktive]} />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function FotoQeZmadhohet({ burimi }: { burimi: number }) {
  const shkalla = useSharedValue(1);
  useEffect(() => {
    shkalla.set(withTiming(1.12, { duration: KOHA_E_FOTOS + 1200, easing: Easing.out(Easing.quad) }));
  }, [shkalla]);
  const stili = useAnimatedStyle(() => ({ transform: [{ scale: shkalla.get() }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, stili]}>
      <Image source={burimi} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hapesira.lg,
  },
  pikat: {
    flexDirection: "row",
    gap: 6,
  },
  pika: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  pikaAktive: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },
});
