import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useStilet } from "../context/TemaContext";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

const SEKSIONET = [
  ["privatesia.cfareTitulli", "privatesia.cfareTeksti"],
  ["privatesia.vendndodhjaTitulli", "privatesia.vendndodhjaTeksti"],
  ["privatesia.kushTitulli", "privatesia.kushTeksti"],
  ["privatesia.fshirjaTitulli", "privatesia.fshirjaTeksti"],
  ["privatesia.osmTitulli", "privatesia.osmTeksti"],
] as const;

// Politika e privatësisë brenda aplikacionit (e njëjta si docs/privatesia.md për App Store).
export default function Privatesia() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.permbajtja}>
      <Text style={styles.data}>{t("privatesia.perditesuar")}</Text>
      <Text style={styles.hyrja}>{t("privatesia.hyrja")}</Text>
      {SEKSIONET.map(([titulli, teksti]) => (
        <View key={titulli} style={styles.karta}>
          <Text style={styles.titulli}>{t(titulli)}</Text>
          <Text style={styles.teksti}>{t(teksti)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      padding: hapesira.lg,
      gap: hapesira.md,
      paddingBottom: hapesira.xxl * 2,
    },
    data: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    hyrja: {
      color: ngjyrat.teksti,
      fontSize: 17,
      lineHeight: 24,
      marginBottom: hapesira.sm,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      padding: hapesira.lg,
      gap: 6,
    },
    titulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
    },
  });
