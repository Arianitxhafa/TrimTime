import { useTranslation } from "react-i18next";
import { ScrollView, Share, StyleSheet, Text } from "react-native";
import { useLokaliIm } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import EkraniINgarkimit from "../../components/EkraniINgarkimit";
import { ikonat } from "../../components/Ikona";
import KartaQr from "../../components/KartaQr";
import { useStilet } from "../../context/TemaContext";
import { qrILokalit } from "../../lib/qr";
import { hapesira, type Ngjyrat } from "../../theme";

// QR-ja e lokalit për t'u printuar: klientët e skanojnë për profilin dhe për check-in.
export default function QrILokalit() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const lokaliIm = useLokaliIm();
  const lokali = lokaliIm.data?.lokali;

  if (!lokali) {
    return <EkraniINgarkimit pyetjet={[lokaliIm]} mungon={lokaliIm.isSuccess} />;
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
