import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  ZoomIn,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import Butoni from "../components/Butoni";
import LogoStudio from "../components/LogoStudio";
import ShiritiIBerberit from "../components/ShiritiIBerberit";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet } from "../context/TemaContext";
import { FOTOT_E_STUDIOS } from "../lib/studio";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";

const faqet = [
  { foto: FOTOT_E_STUDIOS[0], titulli: "onboarding.titulli1", teksti: "onboarding.teksti1" },
  { foto: FOTOT_E_STUDIOS[2], titulli: "onboarding.titulli2", teksti: "onboarding.teksti2" },
  { foto: FOTOT_E_STUDIOS[3], titulli: "onboarding.titulli3", teksti: "onboarding.teksti3" },
] as const;

// Hyrja e parë në aplikacion: tri faqe me punimet e Studios në gjithë ekranin. Fotot lëvizin më
// ngadalë se teksti (paralaks), teksti shfaqet dhe zbehet me rrëshqitjen, logoja qëndron sipër.
export default function Onboarding() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { width: gjeresia } = useWindowDimensions();
  const { perfundoOnboarding } = usePreferencat();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const pozicioni = useSharedValue(0);
  const [faqja, setFaqja] = useState(0);

  const neScroll = useAnimatedScrollHandler((e) => {
    pozicioni.set(e.contentOffset.x);
  });

  // Faqja aktive llogaritet nga pozicioni (onMomentumScrollEnd nuk thirret në web).
  useAnimatedReaction(
    () => Math.round(pozicioni.get() / gjeresia),
    (tani, mePare) => {
      if (tani !== mePare) scheduleOnRN(setFaqja, tani);
    },
  );

  const eFundit = faqja === faqet.length - 1;

  function tjetra() {
    if (eFundit) {
      perfundoOnboarding();
      return;
    }
    setFaqja(faqja + 1);
    scrollRef.current?.scrollTo({ x: gjeresia * (faqja + 1), animated: true });
  }

  return (
    <View style={styles.container}>
      {/* Fotot, një shtresë për çdo faqe, lëvizin me gjysmën e shpejtësisë. */}
      {faqet.map((f, i) => (
        <Sfondi key={f.titulli} foto={f.foto} indeksi={i} gjeresia={gjeresia} pozicioni={pozicioni} />
      ))}
      <LinearGradient
        colors={["rgba(10,10,10,0.7)", "rgba(10,10,10,0)", "rgba(10,10,10,0.55)", "#0A0A0A"]}
        locations={[0, 0.28, 0.58, 0.86]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.koka, { paddingTop: insets.top + hapesira.sm }]}>
        <Animated.View entering={ZoomIn.springify().damping(13)}>
          <LogoStudio madhesia={64} />
        </Animated.View>
        {!eFundit && (
          <Pressable accessibilityRole="button" onPress={perfundoOnboarding} hitSlop={12} style={styles.kaloButoni}>
            <Text style={styles.kalo}>{t("onboarding.kalo")}</Text>
          </Pressable>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={neScroll}
        scrollEventThrottle={16}
        style={styles.faqet}
      >
        {faqet.map((f, i) => (
          <Faqja
            key={f.titulli}
            titulli={t(f.titulli)}
            teksti={t(f.teksti)}
            indeksi={i}
            gjeresia={gjeresia}
            pozicioni={pozicioni}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}>
        <View style={styles.rreshtiIPikave}>
          <View style={styles.pikat}>
            {faqet.map((f, i) => (
              <Pika key={f.titulli} indeksi={i} gjeresia={gjeresia} pozicioni={pozicioni} />
            ))}
          </View>
          <ShiritiIBerberit gjeresia={72} lartesia={8} />
        </View>
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Butoni titulli={t(eFundit ? "onboarding.fillo" : "onboarding.tjetra")} onPress={tjetra} />
        </Animated.View>
      </View>
    </View>
  );
}

type Faqe = {
  indeksi: number;
  gjeresia: number;
  pozicioni: SharedValue<number>;
};

function Sfondi({ foto, indeksi, gjeresia, pozicioni }: Faqe & { foto: number }) {
  const stili = useAnimatedStyle(() => {
    const zhvendosja = pozicioni.get() / gjeresia - indeksi;
    return {
      opacity: interpolate(Math.abs(zhvendosja), [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: -zhvendosja * gjeresia * 0.35 },
        { scale: interpolate(Math.abs(zhvendosja), [0, 1], [1.04, 1.18], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, stili]} pointerEvents="none">
      <Image source={foto} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  );
}

function Faqja({ titulli, teksti, indeksi, gjeresia, pozicioni }: Faqe & { titulli: string; teksti: string }) {
  const styles = useStilet(krijoStilet);

  // Teksti ngrihet pak dhe zbehet ndërsa faqja rrëshqet jashtë ekranit.
  const stili = useAnimatedStyle(() => {
    const largesia = Math.abs(pozicioni.get() / gjeresia - indeksi);
    return {
      opacity: interpolate(largesia, [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(largesia, [0, 1], [0, 28], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.faqja, { width: gjeresia }]}>
      <Animated.View style={stili}>
        <Text style={styles.numri}>0{indeksi + 1}</Text>
        <Text style={styles.titulli}>{titulli}</Text>
        <Text style={styles.teksti}>{teksti}</Text>
      </Animated.View>
    </View>
  );
}

function Pika({ indeksi, gjeresia, pozicioni }: Faqe) {
  const styles = useStilet(krijoStilet);
  const stili = useAnimatedStyle(() => {
    const afersia = interpolate(Math.abs(pozicioni.get() / gjeresia - indeksi), [0, 1], [1, 0], Extrapolation.CLAMP);
    return { width: 8 + 22 * afersia, opacity: 0.35 + 0.65 * afersia };
  });
  return <Animated.View style={[styles.pika, stili]} />;
}

// Onboarding-u është gjithmonë i errët, si fotot, edhe në modin e çelët.
const krijoStilet = (_ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0A0A0A",
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: hapesira.xl,
    },
    kaloButoni: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    kalo: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    faqet: {
      flex: 1,
    },
    faqja: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xl,
    },
    numri: {
      ...shkronjat.etiketeBold,
      color: "#E5484D",
      fontSize: 14,
      letterSpacing: 2,
      marginBottom: hapesira.sm,
    },
    titulli: {
      ...shkronjat.titull,
      color: "#FFFFFF",
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -1.2,
      fontWeight: "800",
    },
    teksti: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 18,
      lineHeight: 26,
      marginTop: hapesira.md,
      maxWidth: 420,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.lg,
    },
    rreshtiIPikave: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pikat: {
      flexDirection: "row",
      gap: 6,
    },
    pika: {
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
    },
  });
