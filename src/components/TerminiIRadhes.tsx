import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { formatoDaten } from "../lib/datat";
import { FOTO_E_LOKALIT } from "../lib/studio";
import type { TerminiIKlientit } from "../lib/tipet";
import { hapesira, rrezja, shkronjat } from "../theme";
import ShiritiIBerberit from "./ShiritiIBerberit";

type Props = {
  termini: TerminiIKlientit;
};

// Sa larg është termini: "pas 25 min", "pas 3 orësh", "pas 2 ditësh"; null kur ka filluar.
function saLarg(fillonMe: string, tani: number) {
  const minuta = Math.round((new Date(fillonMe).getTime() - tani) / 60_000);
  if (minuta <= 0) return null;
  if (minuta < 60) return { celesi: "terminetEMia.pasMin", numri: minuta } as const;
  const ore = Math.round(minuta / 60);
  if (ore < 24) return { celesi: "terminetEMia.pasOresh", numri: ore } as const;
  return { celesi: "terminetEMia.pasDitesh", numri: Math.round(ore / 24) } as const;
}

// Karta e terminit të radhës te "Terminet": mbi foton e Studios, me numërim mbrapsht që
// rifreskohet çdo minutë dhe një pikë që pulson kur termini është sot.
export default function TerminiIRadhes({ termini }: Props) {
  const { t } = useTranslation();
  const [tani, setTani] = useState(() => Date.now());

  useEffect(() => {
    const kohematesi = setInterval(() => setTani(Date.now()), 60_000);
    return () => clearInterval(kohematesi);
  }, []);

  const larg = saLarg(termini.fillon_me, tani);
  const eSotme = larg !== null && larg.celesi !== "terminetEMia.pasDitesh";

  const pulsi = useSharedValue(1);
  useEffect(() => {
    pulsi.set(withRepeat(withTiming(0.25, { duration: 900 }), -1, true));
  }, [pulsi]);
  const stiliIPikes = useAnimatedStyle(() => ({ opacity: pulsi.get() }));

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.karta}>
      <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFill} />

      <View style={styles.koka}>
        {eSotme ? <Animated.View style={[styles.pika, stiliIPikes]} /> : null}
        <Text style={styles.etiketa}>{t("terminetEMia.iRadhes")}</Text>
      </View>

      <Text style={styles.kur} accessibilityLiveRegion="polite">
        {larg ? t(larg.celesi, { numri: larg.numri }) : t("terminetEMia.tani")}
      </Text>
      <Text style={styles.data}>
        {formatoDaten(termini.data_lokale, t)} · {termini.ora_lokale}
      </Text>
      <Text style={styles.sherbimi} numberOfLines={1}>
        {termini.sherbimi_emri} · {t("terminetEMia.me", { berberi: termini.berberi_emri.split(" ")[0] })}
      </Text>
      <ShiritiIBerberit gjeresia={56} lartesia={6} style={styles.shtylla} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  karta: {
    borderRadius: rrezja.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: hapesira.xl,
    paddingTop: hapesira.xxl * 2.5,
    marginBottom: hapesira.lg,
    backgroundColor: "#0A0A0A",
  },
  koka: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pika: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#30D158",
  },
  etiketa: {
    ...shkronjat.etiketeBold,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  kur: {
    ...shkronjat.titull,
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    fontWeight: "800",
  },
  data: {
    ...shkronjat.etiketeBold,
    color: "#FFFFFF",
    fontSize: 17,
    marginTop: 4,
  },
  sherbimi: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    marginTop: 2,
  },
  shtylla: {
    marginTop: hapesira.md,
  },
});
