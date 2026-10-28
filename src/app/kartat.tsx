import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useKartatEMia } from "../api/besnikeria";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import KartaEBesnikerise from "../components/KartaEBesnikerise";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, type Ngjyrat } from "../theme";

// Kartat e besnikërisë së klientit në lokalet ku ka qenë.
export default function KartatEMia() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const kartat = useKartatEMia();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.permbajtja}
      data={kartat.data ?? []}
      keyExtractor={(k) => k.lokali_id}
      ItemSeparatorComponent={() => <View style={{ height: hapesira.md }} />}
      refreshControl={
        <RefreshControl refreshing={kartat.isRefetching} onRefresh={() => void kartat.refetch()} tintColor={ngjyrat.ari} />
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/lokali/[id]", params: { id: item.lokali_id } })}
          style={({ pressed }) => pressed && styles.shtypur}
        >
          <KartaEBesnikerise besnikeria={item} titulli={item.lokali_emri} shenimi={t("besnikeria.tregoNeLokal")} />
        </Pressable>
      )}
      ListEmptyComponent={
        kartat.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : kartat.isError ? (
          <View style={styles.bosh}>
            <Text style={styles.boshTeksti}>{t("pergjithshme.gabimPapritur")}</Text>
            <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => kartat.refetch()} />
          </View>
        ) : (
          <View style={styles.bosh}>
            <View style={styles.boshIkona}>
              <Ikona emri={ikonat.dhurate} madhesia={28} ngjyra={ngjyrat.ari} />
            </View>
            <Text style={styles.boshTitulli}>{t("besnikeria.boshTitulli")}</Text>
            <Text style={styles.boshTeksti}>{t("besnikeria.boshTeksti")}</Text>
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
    permbajtja: {
      padding: hapesira.xl,
    },
    shtypur: {
      opacity: 0.8,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl,
    },
    boshIkona: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      maxWidth: 300,
      marginBottom: hapesira.md,
    },
  });
