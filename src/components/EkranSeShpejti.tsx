import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { type EmriIkones } from "./Ikona";

type Props = {
  ikona: EmriIkones;
  titulli: string;
  teksti: string;
  // Faza e planit kur ndërtohet ky ekran.
  faza: number;
};

// Ekran i përkohshëm për tab-et që ndërtohen në fazat e ardhshme.
export default function EkranSeShpejti({ ikona, titulli, teksti, faza }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.rrethiJashtem}>
        <View style={styles.rrethiBrendshem}>
          <Ikona emri={ikona} madhesia={34} ngjyra={ngjyrat.mbiAri} />
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeTeksti}>
          {t("pergjithshme.seShpejti")} · {t("seShpejti.faza", { numri: faza })}
        </Text>
      </View>
      <Text style={styles.titulli}>{titulli}</Text>
      <Text style={styles.teksti}>{teksti}</Text>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.xxl,
    },
    rrethiJashtem: {
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.xl,
    },
    rrethiBrendshem: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      marginBottom: hapesira.md,
    },
    badgeTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
      textAlign: "center",
      marginBottom: hapesira.sm,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 320,
    },
  });
