import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import type { LokaliPrane } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  lokali: LokaliPrane;
  // Në hartë karta është më e ngushtë dhe pa foto të madhe.
  kompakte?: boolean;
};

export default function KartaELokalit({ lokali, kompakte = false }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lokali.emri}
      onPress={() => router.push({ pathname: "/lokali/[id]", params: { id: lokali.id } })}
      style={({ pressed }) => [styles.karta, kompakte && styles.kartaKompakte, pressed && styles.shtypur]}
    >
      {!kompakte && (
        <View style={styles.kopertina}>
          {lokali.kopertina_url ? (
            <Image source={{ uri: lokali.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.kopertinaBosh]}>
              <Ikona emri={ikonat.gershere} madhesia={36} ngjyra={ngjyrat.ari} />
            </View>
          )}
          <View style={[styles.statusi, lokali.i_hapur_tani ? styles.statusiHapur : styles.statusiMbyllur]}>
            <View style={[styles.pika, { backgroundColor: lokali.i_hapur_tani ? "#3DD68C" : "#A1A1AE" }]} />
            <Text style={styles.statusiTeksti}>
              {lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.trupi, kompakte && styles.trupiKompakt]}>
        <View style={styles.logo}>
          {lokali.logo_url ? (
            <Image source={{ uri: lokali.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={styles.logoShkronja}>{lokali.emri.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.teksti}>
          <Text style={styles.emri} numberOfLines={1}>
            {lokali.emri}
          </Text>
          <Text style={styles.adresa} numberOfLines={1}>
            {lokali.adresa}, {lokali.qyteti} · {formatoDistancen(lokali.distanca_m)}
          </Text>
          {kompakte && (
            <Text style={[styles.adresa, { color: lokali.i_hapur_tani ? "#3DD68C" : ngjyrat.tekstiZbehte }]}>
              {lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")}
            </Text>
          )}
        </View>
        {lokali.cmimi_min !== null && (
          <Text style={styles.cmimi}>{t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) })}</Text>
        )}
      </View>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    kartaKompakte: {
      borderRadius: rrezja.lg,
    },
    shtypur: {
      opacity: 0.9,
      transform: [{ scale: 0.99 }],
    },
    kopertina: {
      height: 150,
      backgroundColor: ngjyrat.siperfaqja2,
    },
    kopertinaBosh: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ngjyrat.ariIErret,
    },
    statusi: {
      position: "absolute",
      top: hapesira.md,
      left: hapesira.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: rrezja.plote,
    },
    statusiHapur: {
      backgroundColor: "rgba(11,11,15,0.75)",
    },
    statusiMbyllur: {
      backgroundColor: "rgba(11,11,15,0.6)",
    },
    pika: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusiTeksti: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    trupi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.md,
    },
    trupiKompakt: {
      padding: hapesira.md,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoShkronja: {
      color: ngjyrat.mbiAri,
      fontSize: 20,
      fontWeight: "800",
    },
    teksti: {
      flex: 1,
      gap: 3,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    cmimi: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "800",
    },
  });
