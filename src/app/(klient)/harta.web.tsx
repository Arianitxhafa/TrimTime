import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { hapesira, shkronjat, type Ngjyrat } from "../../theme";

// react-native-maps nuk punon në web: harta me rrugën është vetëm në telefon.
export default function Harta() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.container}>
      <Ikona emri={ikonat.harta} madhesia={36} ngjyra={ngjyrat.portokalli} />
      <Text style={styles.titulli}>{t("harta.webTitulli")}</Text>
      <Text style={styles.teksti}>{t("harta.webTeksti")}</Text>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.md,
      padding: hapesira.xl,
      backgroundColor: ngjyrat.sfondi,
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
      textAlign: "center",
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      textAlign: "center",
      maxWidth: 420,
    },
  });
