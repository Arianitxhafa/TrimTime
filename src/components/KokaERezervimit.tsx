import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useTema } from "../context/TemaContext";
import { FOTO_E_LOKALIT } from "../lib/studio";
import { hapesira, rrezja, shkronjat } from "../theme";
import LogoStudio from "./LogoStudio";

type Props = {
  emri: string;
  adresa: string;
  // 0 shërbimi, 1 dita dhe ora, 2 gati për konfirmim.
  hapi: 0 | 1 | 2;
};

const HAPAT = ["rezervimi.hapiSherbimi", "rezervimi.hapiOra", "rezervimi.hapiKonfirmo"] as const;

// Koka e rezervimit: fotoja e Studios me logon dhe tre hapat, që mbushen ndërsa klienti zgjedh.
export default function KokaERezervimit({ emri, adresa, hapi }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={styles.karta}>
      <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.rreshti}>
        <LogoStudio madhesia={48} />
        <View style={styles.teksti}>
          <Text style={styles.emri} numberOfLines={1}>
            {emri}
          </Text>
          <Text style={styles.adresa} numberOfLines={1}>
            {adresa}
          </Text>
        </View>
      </View>

      <View style={styles.hapat} accessibilityLabel={t(HAPAT[hapi])}>
        {HAPAT.map((h, i) => (
          <View key={h} style={styles.hapi}>
            <View style={styles.vija}>
              <Animated.View
                layout={LinearTransition.springify().damping(18)}
                style={[styles.mbushja, { width: i <= hapi ? "100%" : "0%", backgroundColor: i === hapi ? ngjyrat.theksi : "#FFFFFF" }]}
              />
            </View>
            <Text style={[styles.hapiTeksti, i <= hapi && styles.hapiTekstiAktiv]} numberOfLines={1}>
              {t(h)}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  karta: {
    borderRadius: rrezja.lg,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: hapesira.lg,
    paddingTop: hapesira.xxl * 2,
    gap: hapesira.lg,
    backgroundColor: "#0A0A0A",
  },
  rreshti: {
    flexDirection: "row",
    alignItems: "center",
    gap: hapesira.md,
  },
  teksti: {
    flex: 1,
  },
  emri: {
    ...shkronjat.titull,
    color: "#FFFFFF",
    fontSize: 22,
    letterSpacing: -0.4,
    fontWeight: "800",
  },
  adresa: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
  hapat: {
    flexDirection: "row",
    gap: hapesira.sm,
  },
  hapi: {
    flex: 1,
    gap: 6,
  },
  vija: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  mbushja: {
    height: 4,
    borderRadius: 2,
  },
  hapiTeksti: {
    ...shkronjat.etiketeBold,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  hapiTekstiAktiv: {
    color: "#FFFFFF",
  },
});
