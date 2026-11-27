import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { usePorositeEMia } from "../api/dyqani";
import Ikona, { ikonat } from "../components/Ikona";
import KartaEPorosise from "../components/KartaEPorosise";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, type Ngjyrat } from "../theme";

// Porositë e mia: çdo porosi me statusin (e re, gati për t'u marrë, marrë, anuluar) dhe artikujt.
export default function PorositeEMia() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const porosite = usePorositeEMia();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.lista}
      data={porosite.data ?? []}
      keyExtractor={(p) => p.id}
      refreshControl={
        <RefreshControl refreshing={porosite.isRefetching} onRefresh={() => void porosite.refetch()} tintColor={ngjyrat.ari} />
      }
      renderItem={({ item, index }) => <KartaEPorosise porosia={item} vonesa={Math.min(index, 8) * 50} />}
      ListEmptyComponent={
        porosite.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : (
          <View style={styles.bosh}>
            <Ikona emri={ikonat.shenime} madhesia={30} ngjyra={ngjyrat.ari} />
            <Text style={styles.boshTeksti}>{t("dyqani.paPorosi")}</Text>
          </View>
        )
      }
    />
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    lista: {
      padding: hapesira.xl,
      gap: hapesira.md,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.xxl * 2,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
    },
  });
