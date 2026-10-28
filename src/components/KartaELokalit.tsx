import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useStilet, useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import type { LokaliPrane } from "../lib/tipet";
import { hapesira, hijet, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";
import Xham from "./Xham";

type Props = {
  lokali: LokaliPrane;
  // Në hartë karta është më e ngushtë dhe pa foto të madhe.
  kompakte?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const HAPUR = "#3DD68C";

export default function KartaELokalit({ lokali, kompakte = false }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.98);
  const kaVleresim = lokali.vleresimi_mesatar != null && lokali.nr_vleresimeve > 0;

  function hap() {
    prekja.lehte();
    router.push({ pathname: "/lokali/[id]", params: { id: lokali.id } });
  }

  if (kompakte) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lokali.emri}
        onPress={hap}
        style={({ pressed }) => [styles.kompakte, pressed && styles.shtypur]}
      >
        <Logo lokali={lokali} madhesia={44} />
        <View style={styles.teksti}>
          <View style={styles.rreshti}>
            <Text style={styles.emriKompakt} numberOfLines={1}>
              {lokali.emri}
            </Text>
            {lokali.promocioni_max ? (
              <Text style={styles.promoKompakte}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {kaVleresim ? `★ ${Number(lokali.vleresimi_mesatar).toFixed(1)} · ` : ""}
            {formatoDistancen(lokali.distanca_m)}
            {lokali.cmimi_min !== null ? ` · ${t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) })}` : ""}
          </Text>
          <Text style={[styles.meta, { color: lokali.i_hapur_tani ? HAPUR : ngjyrat.tekstiZbehte }]}>
            {lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")}
          </Text>
        </View>
        <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />
      </Pressable>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={lokali.emri}
      onPressIn={shtypja.onPressIn}
      onPressOut={shtypja.onPressOut}
      onPress={hap}
      style={[styles.karta, hijet.karte, shtypja.stili]}
    >
      <View style={styles.kopertina}>
        {lokali.kopertina_url ? (
          <Image source={{ uri: lokali.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        ) : (
          <LinearGradient
            colors={[ngjyrat.siperfaqja2, ngjyrat.ariIErret]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.kopertinaBosh]}
          >
            <Ikona emri={ikonat.gershere} madhesia={44} ngjyra={ngjyrat.ari} />
          </LinearGradient>
        )}
        <LinearGradient colors={ngjyrat.hijaEFotos} style={styles.hija} />

        <Xham style={styles.etiketaStatusi}>
          <View style={[styles.pika, { backgroundColor: lokali.i_hapur_tani ? HAPUR : "#A1A1AE" }]} />
          <Text style={styles.etiketaTeksti}>{lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")}</Text>
        </Xham>

        {lokali.promocioni_max ? (
          <LinearGradient colors={ngjyrat.gradientiAri} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
            <Ikona emri={ikonat.etiketa} madhesia={12} ngjyra={ngjyrat.mbiAri} />
            <Text style={styles.promoTeksti}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
          </LinearGradient>
        ) : null}

        <View style={styles.mbiFoto}>
          <Logo lokali={lokali} madhesia={46} />
          <View style={styles.teksti}>
            <Text style={styles.emri} numberOfLines={1}>
              {lokali.emri}
            </Text>
            <Text style={styles.adresa} numberOfLines={1}>
              {lokali.adresa}, {lokali.qyteti}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.fundi}>
        {kaVleresim ? (
          <View style={styles.fakti}>
            <Ikona emri={ikonat.yll} madhesia={13} ngjyra={ngjyrat.ari} />
            <Text style={styles.faktiTeksti}>
              {Number(lokali.vleresimi_mesatar).toFixed(1)}
              <Text style={styles.faktiZbehte}> ({lokali.nr_vleresimeve})</Text>
            </Text>
          </View>
        ) : null}
        <View style={styles.fakti}>
          <Ikona emri={ikonat.harta} madhesia={13} ngjyra={ngjyrat.tekstiDyte} />
          <Text style={styles.faktiTeksti}>{formatoDistancen(lokali.distanca_m)}</Text>
        </View>
        {lokali.cmimi_min !== null && (
          <Text style={styles.cmimi}>{t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) })}</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

function Logo({ lokali, madhesia }: { lokali: LokaliPrane; madhesia: number }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <View style={[styles.logo, { width: madhesia, height: madhesia, borderRadius: madhesia * 0.3 }]}>
      {lokali.logo_url ? (
        <Image source={{ uri: lokali.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient colors={ngjyrat.gradientiAri} style={[StyleSheet.absoluteFill, styles.logoBosh]}>
          <Text style={styles.logoShkronja}>{lokali.emri.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg + 4,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    kopertina: {
      height: 210,
      borderTopLeftRadius: rrezja.lg + 3,
      borderTopRightRadius: rrezja.lg + 3,
      overflow: "hidden",
      backgroundColor: ngjyrat.siperfaqja2,
    },
    kopertinaBosh: {
      alignItems: "center",
      justifyContent: "center",
    },
    hija: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "70%",
    },
    etiketaStatusi: {
      position: "absolute",
      top: hapesira.md,
      left: hapesira.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
    },
    pika: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    etiketaTeksti: {
      color: ngjyrat.teksti,
      fontSize: 12,
      fontWeight: "700",
    },
    promo: {
      position: "absolute",
      top: hapesira.md,
      right: hapesira.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
    },
    promoTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 12,
      fontWeight: "900",
    },
    mbiFoto: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
      bottom: hapesira.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    emri: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    adresa: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 13,
    },
    fundi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      paddingHorizontal: hapesira.lg,
      paddingVertical: hapesira.md + 2,
    },
    fakti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    faktiTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    faktiZbehte: {
      color: ngjyrat.tekstiZbehte,
      fontWeight: "500",
    },
    cmimi: {
      marginLeft: "auto",
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "800",
    },
    kompakte: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    shtypur: {
      opacity: 0.9,
    },
    teksti: {
      flex: 1,
      gap: 3,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    emriKompakt: {
      flexShrink: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    meta: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    promoKompakte: {
      color: ngjyrat.ari,
      fontSize: 12,
      fontWeight: "800",
    },
    logo: {
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.85)",
      backgroundColor: ngjyrat.ari,
    },
    logoBosh: {
      alignItems: "center",
      justifyContent: "center",
    },
    logoShkronja: {
      color: ngjyrat.mbiAri,
      fontSize: 20,
      fontWeight: "900",
    },
  });
