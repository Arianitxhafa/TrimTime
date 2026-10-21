import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import Butoni from "../components/Butoni";
import Ikona, { ikonat, type EmriIkones } from "../components/Ikona";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

const faqet = [
  { ikona: ikonat.harta, titulli: "onboarding.titulli1", teksti: "onboarding.teksti1" },
  { ikona: ikonat.kalendar, titulli: "onboarding.titulli2", teksti: "onboarding.teksti2" },
  { ikona: ikonat.lokali, titulli: "onboarding.titulli3", teksti: "onboarding.teksti3" },
] as const satisfies readonly { ikona: EmriIkones; titulli: string; teksti: string }[];

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
    pozicioni.value = e.contentOffset.x;
  });

  // Kur përdoruesi rrëshqet me gisht, faqja aktive llogaritet nga pozicioni
  // (onMomentumScrollEnd nuk thirret në web).
  useAnimatedReaction(
    () => Math.round(pozicioni.value / gjeresia),
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + hapesira.lg }]}>
      <View style={styles.koka}>
        {!eFundit && (
          <Pressable accessibilityRole="button" onPress={perfundoOnboarding} hitSlop={12}>
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
            ikona={f.ikona}
            titulli={t(f.titulli)}
            teksti={t(f.teksti)}
            indeksi={i}
            gjeresia={gjeresia}
            pozicioni={pozicioni}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.pikat}>
        {faqet.map((f, i) => (
          <Pika key={f.titulli} indeksi={i} gjeresia={gjeresia} pozicioni={pozicioni} />
        ))}
      </View>

      <View style={styles.fundi}>
        <Butoni
          titulli={t(eFundit ? "onboarding.fillo" : "onboarding.tjetra")}
          onPress={tjetra}
        />
      </View>
    </View>
  );
}

type FaqjaProps = {
  ikona: EmriIkones;
  titulli: string;
  teksti: string;
  indeksi: number;
  gjeresia: number;
  pozicioni: SharedValue<number>;
};

function Faqja({ ikona, titulli, teksti, indeksi, gjeresia, pozicioni }: FaqjaProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  // Ilustrimi zmadhohet dhe zbehet ndërsa faqja rrëshqet jashtë ekranit.
  const stiliIlustrimit = useAnimatedStyle(() => {
    const largesia = Math.abs(pozicioni.value / gjeresia - indeksi);
    return {
      opacity: interpolate(largesia, [0, 1], [1, 0.2], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(largesia, [0, 1], [1, 0.7], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.faqja, { width: gjeresia }]}>
      <Animated.View style={[styles.ilustrimi, stiliIlustrimit]}>
        <View style={styles.rrethi3}>
          <View style={styles.rrethi2}>
            <View style={styles.rrethi1}>
              <Ikona emri={ikona} madhesia={44} ngjyra={ngjyrat.mbiAri} />
            </View>
          </View>
        </View>
      </Animated.View>
      <Text style={styles.titulli}>{titulli}</Text>
      <Text style={styles.teksti}>{teksti}</Text>
    </View>
  );
}

type PikaProps = {
  indeksi: number;
  gjeresia: number;
  pozicioni: SharedValue<number>;
};

function Pika({ indeksi, gjeresia, pozicioni }: PikaProps) {
  const styles = useStilet(krijoStilet);
  const stili = useAnimatedStyle(() => {
    const afersia = interpolate(
      Math.abs(pozicioni.value / gjeresia - indeksi),
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { width: 8 + 20 * afersia, opacity: 0.3 + 0.7 * afersia };
  });

  return <Animated.View style={[styles.pika, stili]} />;
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    koka: {
      height: 48,
      alignItems: "flex-end",
      justifyContent: "center",
      paddingHorizontal: hapesira.xl,
    },
    kalo: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "700",
    },
    faqet: {
      flex: 1,
    },
    faqja: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.xxl,
    },
    ilustrimi: {
      marginBottom: hapesira.xxl * 1.5,
    },
    rrethi3: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    rrethi2: {
      width: 172,
      height: 172,
      borderRadius: 86,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    rrethi1: {
      width: 108,
      height: 108,
      borderRadius: 54,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      textAlign: "center",
      marginBottom: hapesira.md,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      maxWidth: 340,
    },
    pikat: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
      marginVertical: hapesira.xl,
    },
    pika: {
      height: 8,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ari,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
    },
  });
