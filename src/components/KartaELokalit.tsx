import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useStilet, useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import type { LokaliPrane } from "../lib/tipet";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  lokali: LokaliPrane;
  // Në hartë karta është më e ngushtë dhe pa foto të madhe.
  kompakte?: boolean;
  // Numri i artikullit në listë ("01", "02"…), si në një revistë.
  indeksi?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Një lokal si artikull reviste: numër, vijë, foto me kënde të drejta, emri me serif dhe
// detajet me mono.
export default function KartaELokalit({ lokali, kompakte = false, indeksi }: Props) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.985);
  const kaVleresim = lokali.vleresimi_mesatar != null && lokali.nr_vleresimeve > 0;
  const ngjyraEStatusit = lokali.i_hapur_tani ? statusetMeta.konfirmuar.ngjyra : ngjyrat.tekstiZbehte;

  function hap() {
    prekja.lehte();
    router.push({ pathname: "/lokali/[id]", params: { id: lokali.id } });
  }

  const detajet = [
    lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur"),
    formatoDistancen(lokali.distanca_m),
    lokali.cmimi_min !== null ? t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) }) : null,
  ].filter(Boolean);

  if (kompakte) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lokali.emri}
        onPress={hap}
        style={({ pressed }) => [styles.kompakte, pressed && styles.shtypur]}
      >
        <View style={styles.teksti}>
          <Text style={styles.emriKompakt} numberOfLines={1}>
            {lokali.emri}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {kaVleresim ? `★ ${Number(lokali.vleresimi_mesatar).toFixed(1)} · ` : ""}
            {detajet.join(" · ")}
          </Text>
        </View>
        {lokali.promocioni_max ? (
          <Text style={styles.promo}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
        ) : null}
        <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.teksti} />
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
      style={[styles.artikulli, shtypja.stili]}
    >
      <View style={styles.koka}>
        <Text style={styles.numri}>{indeksi !== undefined ? String(indeksi + 1).padStart(2, "0") : "—"}</Text>
        {kaVleresim ? (
          <Text style={styles.vleresimi}>
            ★ {Number(lokali.vleresimi_mesatar).toFixed(1)}
            <Text style={styles.zbehte}> ({lokali.nr_vleresimeve})</Text>
          </Text>
        ) : null}
      </View>

      {/* Pa foto, artikulli mbetet vetëm tekst: lista nuk mbushet me kuti bosh. */}
      {lokali.kopertina_url ? (
        <View style={styles.foto}>
          <Image source={{ uri: lokali.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          {lokali.promocioni_max ? (
            <View style={styles.promoEtiketa}>
              <Text style={styles.promoEtiketaTeksti}>
                {t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}
              </Text>
            </View>
          ) : null}
        </View>
      ) : lokali.promocioni_max ? (
        <View style={[styles.promoEtiketa, styles.promoNeRresht]}>
          <Text style={styles.promoEtiketaTeksti}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
        </View>
      ) : null}

      <Text style={styles.emri} numberOfLines={2}>
        {lokali.emri}
      </Text>
      <Text style={styles.adresa} numberOfLines={1}>
        {lokali.adresa}, {lokali.qyteti}
      </Text>
      <View style={styles.detajet}>
        <View style={[styles.pika, { backgroundColor: ngjyraEStatusit }]} />
        <Text style={styles.meta} numberOfLines={1}>
          {detajet.join("  ·  ")}
        </Text>
        <Text style={styles.lexo}>→</Text>
      </View>
    </AnimatedPressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    artikulli: {
      borderTopWidth: 1.5,
      borderTopColor: ngjyrat.vija,
      paddingTop: hapesira.md,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: hapesira.md,
    },
    numri: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.theksi,
      fontSize: 12,
      letterSpacing: 1.5,
    },
    vleresimi: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 12,
      letterSpacing: 0.5,
    },
    zbehte: {
      color: ngjyrat.tekstiZbehte,
    },
    foto: {
      aspectRatio: 4 / 3,
      backgroundColor: ngjyrat.siperfaqja2,
      overflow: "hidden",
    },
    promoNeRresht: {
      position: "relative",
      top: 0,
      right: 0,
      alignSelf: "flex-start",
    },
    promoEtiketa: {
      position: "absolute",
      top: hapesira.md,
      right: hapesira.md,
      backgroundColor: ngjyrat.theksi,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    promoEtiketaTeksti: {
      fontFamily: shkronjat.monoBold,
      color: "#FFFFFF",
      fontSize: 12,
      letterSpacing: 1,
    },
    emri: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.6,
      marginTop: hapesira.sm,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      marginTop: 4,
    },
    detajet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginTop: hapesira.md,
    },
    pika: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    meta: {
      flexShrink: 1,
      fontFamily: shkronjat.mono,
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    lexo: {
      marginLeft: "auto",
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    kompakte: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
      backgroundColor: ngjyrat.sfondi,
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
    },
    shtypur: {
      opacity: 0.85,
    },
    teksti: {
      flex: 1,
      gap: 4,
    },
    emriKompakt: {
      fontFamily: shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 19,
    },
    promo: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.theksi,
      fontSize: 12,
    },
  });
