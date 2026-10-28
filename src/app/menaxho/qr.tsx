import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLokaliIm } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import { ikonat } from "../../components/Ikona";
import KartaQr from "../../components/KartaQr";
import { useStilet, useTema } from "../../context/TemaContext";
import { qrILokalit } from "../../lib/qr";
import { hapesira, type Ngjyrat } from "../../theme";

// QR-ja e lokalit për t'u printuar: klientët e skanojnë për profilin dhe për check-in.
export default function QrILokalit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokali = useLokaliIm().data?.lokali;

  if (!lokali) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  const lidhja = qrILokalit(lokali.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <KartaQr vlera={lidhja} titulli={lokali.emri} nentitulli="TRIMTIME" />
      <Text style={styles.teksti}>{t("qr.teksti")}</Text>
      <Butoni
        titulli={t("qr.ndaj")}
        ikona={ikonat.ndaj}
        onPress={() => Share.share({ message: `${lokali.emri}\n${lidhja}` })}
      />
    </ScrollView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    qendra: {
      alignItems: "center",
      justifyContent: "center",
    },
    permbajtja: {
      padding: hapesira.xl,
      gap: hapesira.xl,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
  });
