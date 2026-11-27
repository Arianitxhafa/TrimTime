import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { usePorositeEStudios } from "../../api/dyqani";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaEPorosise from "../../components/KartaEPorosise";
import { useStilet, useTema } from "../../context/TemaContext";
import { prekja } from "../../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../../theme";

type Filtri = "te_hapura" | "te_gjitha";

// Porositë e Studios për stafin: të hapurat (të reja dhe gati) sipër, me "Gati", "U mor" dhe "Anulo".
export default function PorositeEStudios() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const porosite = usePorositeEStudios(true);
  const [filtri, setFiltri] = useState<Filtri>("te_hapura");
  const lista = (porosite.data ?? []).filter((p) => filtri === "te_gjitha" || p.statusi === "e_re" || p.statusi === "gati");

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.lista}
      data={lista}
      keyExtractor={(p) => p.id}
      refreshControl={
        <RefreshControl refreshing={porosite.isRefetching} onRefresh={() => void porosite.refetch()} tintColor={ngjyrat.ari} />
      }
      ListHeaderComponent={
        <View style={styles.filtrat}>
          {(["te_hapura", "te_gjitha"] as const).map((f) => (
            <Pressable
              key={f}
              accessibilityRole="tab"
              accessibilityState={{ selected: filtri === f }}
              onPress={() => {
                prekja.zgjedhje();
                setFiltri(f);
              }}
              style={[styles.filtri, filtri === f && styles.filtriAktiv]}
            >
              <Text style={[styles.filtriTeksti, filtri === f && styles.filtriTekstiAktiv]}>{t(`dyqani.${f}`)}</Text>
            </Pressable>
          ))}
        </View>
      }
      renderItem={({ item, index }) => <KartaEPorosise porosia={item} perStafin vonesa={Math.min(index, 8) * 50} />}
      ListEmptyComponent={
        porosite.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : (
          <View style={styles.bosh}>
            <Ikona emri={ikonat.shenime} madhesia={30} ngjyra={ngjyrat.ari} />
            <Text style={styles.boshTeksti}>{t("dyqani.paPorosiStafi")}</Text>
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
    filtrat: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 16,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      marginBottom: hapesira.sm,
    },
    filtri: {
      flex: 1,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    filtriAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    filtriTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    filtriTekstiAktiv: {
      color: ngjyrat.mbiAri,
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
