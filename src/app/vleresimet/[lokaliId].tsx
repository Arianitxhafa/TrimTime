import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali, useLokaliIm } from "../../api/lokalet";
import { useVleresimetELokalit } from "../../api/vleresimet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaEVleresimit from "../../components/KartaEVleresimit";
import Yjet from "../../components/Yjet";
import { useStilet, useTema } from "../../context/TemaContext";
import { hapesira, type Ngjyrat } from "../../theme";

// E përbashkët për klientin dhe stafin; pronari i lokalit mund të përgjigjet.
export default function Vleresimet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { lokaliId } = useLocalSearchParams<{ lokaliId: string }>();
  const lokali = useLokali(lokaliId);
  const lokaliIm = useLokaliIm();
  const vleresimet = useVleresimetELokalit(lokaliId);
  const eshtePronar = lokaliIm.data?.roli === "pronar" && lokaliIm.data.lokali.id === lokaliId;
  const lista = vleresimet.data?.pages.flat() ?? [];
  const mesatarja = lokali.data?.vleresimi_mesatar;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}
      data={lista}
      keyExtractor={(v) => v.id}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: hapesira.md }} />}
      refreshControl={
        <RefreshControl
          refreshing={vleresimet.isRefetching}
          onRefresh={() => void vleresimet.refetch()}
          tintColor={ngjyrat.ari}
        />
      }
      ListHeaderComponent={
        mesatarja != null ? (
          <View style={styles.koka}>
            <Text style={styles.mesatarja}>{Number(mesatarja).toFixed(1)}</Text>
            <Yjet vlera={Number(mesatarja)} madhesia={20} />
            <Text style={styles.numri}>
              {t("vleresimet.mesatarja", {
                mesatarja: Number(mesatarja).toFixed(1),
                numri: lokali.data?.nr_vleresimeve ?? 0,
              })}
            </Text>
          </View>
        ) : undefined
      }
      renderItem={({ item }) => <KartaEVleresimit vleresimi={item} mundTePergjigjet={eshtePronar} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (vleresimet.hasNextPage && !vleresimet.isFetchingNextPage) vleresimet.fetchNextPage();
      }}
      ListFooterComponent={
        vleresimet.isFetchingNextPage ? <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} /> : undefined
      }
      ListEmptyComponent={
        vleresimet.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : vleresimet.isError ? (
          <View style={styles.bosh}>
            <Text style={styles.boshTeksti}>{t("pergjithshme.gabimPapritur")}</Text>
            <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => vleresimet.refetch()} />
          </View>
        ) : (
          <View style={styles.bosh}>
            <View style={styles.boshIkona}>
              <Ikona emri={ikonat.yll} madhesia={28} ngjyra={ngjyrat.ari} />
            </View>
            <Text style={styles.boshTitulli}>{t("vleresimet.paVleresime")}</Text>
            <Text style={styles.boshTeksti}>{t("vleresimet.boshTeksti")}</Text>
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
    koka: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingBottom: hapesira.xl,
    },
    mesatarja: {
      color: ngjyrat.teksti,
      fontSize: 48,
      fontWeight: "800",
      letterSpacing: -1,
    },
    numri: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    ngarkimi: {
      marginVertical: hapesira.xl,
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
