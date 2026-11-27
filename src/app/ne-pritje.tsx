import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import LogoStudio from "../components/LogoStudio";
import ShiritiIBerberit from "../components/ShiritiIBerberit";
import { useAuth } from "../context/AuthContext";
import { useStilet, useTema } from "../context/TemaContext";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

// Llogaria e re pret aprovimin e Studios. Statusi kontrollohet vetë çdo 20 sekonda dhe me butonin
// "Rifresko statusin"; sapo pronari e aprovon, navigimi kalon vetë te aplikacioni (shih _layout.tsx).
export default function NePritje() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { profili, rifreskoProfilin, dil } = useAuth();
  const [duke, setDuke] = useState(false);
  const iRefuzuar = profili?.statusi === "refuzuar";

  useEffect(() => {
    const kohematesi = setInterval(() => void rifreskoProfilin(), 20_000);
    return () => clearInterval(kohematesi);
  }, [rifreskoProfilin]);

  const pulsi = useSharedValue(1);
  useEffect(() => {
    pulsi.set(withRepeat(withTiming(0.3, { duration: 900 }), -1, true));
  }, [pulsi]);
  const stiliIPikes = useAnimatedStyle(() => ({ opacity: pulsi.get() }));

  async function rifresko() {
    setDuke(true);
    prekja.lehte();
    await rifreskoProfilin();
    setTimeout(() => setDuke(false), 700);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg, paddingBottom: insets.bottom + hapesira.lg }]}>
      <Text style={styles.koka}>{t("pritja.koka")}</Text>

      <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.karta}>
        <Animated.View entering={ZoomIn.delay(120).springify().damping(13)} style={styles.logo}>
          <LogoStudio madhesia={72} />
          <ShiritiIBerberit gjeresia={56} lartesia={6} />
        </Animated.View>
        <Text style={styles.titulli}>{iRefuzuar ? t("pritja.refuzuarTitulli") : t("pritja.titulli")}</Text>
        <Text style={styles.teksti}>{iRefuzuar ? t("pritja.refuzuarTeksti") : t("pritja.teksti")}</Text>
        <View style={styles.statusi}>
          <Text style={styles.statusiEtiketa}>{t("pritja.statusiAktual")}</Text>
          <View style={styles.statusiRreshti}>
            <Animated.View
              style={[styles.pika, { backgroundColor: iRefuzuar ? ngjyrat.rrezik : ngjyrat.theksi }, !iRefuzuar && stiliIPikes]}
            />
            <Text style={styles.statusiVlera}>{iRefuzuar ? t("pritja.refuzuar") : t("pritja.nePritje")}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.hapesire} />

      <Animated.View entering={FadeInDown.delay(200).duration(420)} style={styles.butonat}>
        <Butoni titulli={t("pritja.rifresko")} varianti="dytesor" ikona={ikonat_rifresko} ngarkohet={duke} onPress={() => void rifresko()} />
        <Butoni titulli={t("profili.dil")} onPress={() => void dil()} />
      </Animated.View>
    </View>
  );
}

const ikonat_rifresko = { ios: "arrow.clockwise", android: "refresh" } as const;

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
      paddingHorizontal: hapesira.xl,
    },
    koka: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 20,
      textAlign: "center",
      marginBottom: hapesira.xl,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: 32,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.xl,
      gap: hapesira.md,
    },
    logo: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      marginBottom: hapesira.sm,
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -1,
      fontWeight: "800",
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
    },
    statusi: {
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: 6,
      marginTop: hapesira.sm,
    },
    statusiEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    statusiRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    pika: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statusiVlera: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
    },
    hapesire: {
      flex: 1,
    },
    butonat: {
      gap: hapesira.md,
    },
  });
