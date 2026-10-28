import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import type { Besnikeria } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  besnikeria: Besnikeria;
  titulli?: string;
  // Teksti nën pikat, p.sh. "Tregoja berberit…" për klientin.
  shenimi?: string;
};

// Karta me pika: secila pikë e mbushur është një vizitë drejt shpërblimit të ardhshëm.
export default function KartaEBesnikerise({ besnikeria: b, titulli, shenimi }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const kaShperblim = b.te_disponueshme > 0;

  return (
    <View style={[styles.karta, kaShperblim && styles.kartaGati]}>
      <View style={styles.koka}>
        <View style={styles.ikona}>
          <Ikona emri={ikonat.dhurate} madhesia={18} ngjyra={ngjyrat.mbiAri} />
        </View>
        <View style={styles.kokaTeksti}>
          <Text style={styles.titulli} numberOfLines={1}>
            {titulli ?? t("besnikeria.titulli")}
          </Text>
          <Text style={styles.rregulli} numberOfLines={2}>
            {t("besnikeria.rregulli", { numri: b.nevojiten, shperblimi: b.shperblimi })}
          </Text>
        </View>
      </View>

      <View style={styles.pikat} accessibilityLabel={t("besnikeria.progresi", { progresi: b.progresi, nevojiten: b.nevojiten })}>
        {Array.from({ length: b.nevojiten }, (_, i) => (
          <View key={i} style={[styles.pika, i < b.progresi && styles.pikaEMbushur]} />
        ))}
      </View>

      <Text style={[styles.statusi, kaShperblim && styles.statusiGati]}>
        {kaShperblim
          ? t("besnikeria.gati", { numri: b.te_disponueshme })
          : t("besnikeria.progresi", { progresi: b.progresi, nevojiten: b.nevojiten })}
      </Text>
      {shenimi && kaShperblim ? <Text style={styles.shenimi}>{shenimi}</Text> : null}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    kartaGati: {
      borderColor: ngjyrat.ari,
      backgroundColor: ngjyrat.ariIErret,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    ikona: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    kokaTeksti: {
      flex: 1,
      gap: 2,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    rregulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    pikat: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    pika: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: ngjyrat.ari,
    },
    pikaEMbushur: {
      backgroundColor: ngjyrat.ari,
    },
    statusi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "700",
    },
    statusiGati: {
      color: ngjyrat.ari,
    },
    shenimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      marginTop: -hapesira.sm,
    },
  });
