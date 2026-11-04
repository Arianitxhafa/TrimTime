import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { hapesira } from "../theme";
import Butoni from "./Butoni";
import Ikona, { ikonat } from "./Ikona";

type Pyetja = { isError: boolean; isFetching: boolean; refetch: () => unknown };

type Props = {
  // Pyetjet nga varet ekrani; e para është ajo nga varen të tjerat (zakonisht lokali).
  pyetjet: Pyetja[];
  // true kur ngarkimi mbaroi, por mungon ajo që i duhet ekranit (p.sh. llogaria s'ka më lokal).
  mungon?: boolean;
};

// Ekrani derisa të vijnë të dhënat: rrotullim gjatë ngarkimit, gabim me "Provo përsëri" kur dështon.
// Pa këtë, një pyetje e dështuar ose e çaktivizuar lë rrotullimin pa fund.
export default function EkraniINgarkimit({ pyetjet, mungon = false }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const teDeshtuara = pyetjet.filter((p) => p.isError);

  if (teDeshtuara.length === 0 && !mungon) {
    return (
      <View style={[styles.ekrani, { backgroundColor: ngjyrat.sfondi }]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  return (
    <View style={[styles.ekrani, { backgroundColor: ngjyrat.sfondi }]}>
      <Ikona emri={ikonat.gabim} madhesia={32} ngjyra={ngjyrat.tekstiDyte} />
      <Text style={[styles.teksti, { color: ngjyrat.tekstiDyte }]}>{t("pergjithshme.gabimPapritur")}</Text>
      <Butoni
        titulli={t("zbulo.provoPerseri")}
        varianti="dytesor"
        ikona={ikonat.kthe}
        ngarkohet={pyetjet.some((p) => p.isFetching)}
        onPress={() => {
          // Vetëm të dështuarat: refetch() do të nisej edhe për një pyetje të çaktivizuar pa lokal.
          (teDeshtuara.length > 0 ? teDeshtuara : pyetjet.slice(0, 1)).forEach((p) => p.refetch());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ekrani: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: hapesira.md,
    padding: hapesira.xxl,
  },
  teksti: {
    fontSize: 14,
    textAlign: "center",
  },
});
