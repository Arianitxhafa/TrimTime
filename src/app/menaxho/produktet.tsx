import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProduktet } from "../../api/dyqani";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoCmimin } from "../../lib/formatimi";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

// Produktet e Studios për pronarin: të gjitha, edhe të fshehurat, me stokun. Shtyp për t'i ndryshuar.
export default function ProduktetEStudios() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const produktet = useProduktet();

  return (
    <View style={styles.container}>
      <FlatList
        data={produktet.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 110 }]}
        renderItem={({ item: p, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 45).duration(360)}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/menaxho/produkti", params: { id: p.id } })}
              style={({ pressed }) => [styles.rreshti, !p.aktiv && styles.joAktiv, pressed && styles.shtypur]}
            >
              <View style={styles.fotoKutia}>
                {p.foto_url ? (
                  <Image source={{ uri: p.foto_url }} style={styles.foto} contentFit="contain" />
                ) : (
                  <Ikona emri={ikonat.dhurate} madhesia={22} ngjyra={ngjyrat.tekstiZbehte} />
                )}
              </View>
              <View style={styles.teksti}>
                <Text style={styles.emri} numberOfLines={1}>
                  {p.emri}
                </Text>
                <Text style={styles.detaje} numberOfLines={1}>
                  {t(`dyqani.kategoria_${p.kategoria}`)}
                  {p.ne_stok !== null ? ` · ${t("dyqani.neStok", { numri: p.ne_stok })}` : ""}
                  {!p.aktiv ? ` · ${t("dyqani.iFshehur")}` : ""}
                </Text>
              </View>
              <Text style={styles.cmimi}>{formatoCmimin(p.cmimi_centa)}</Text>
              <Ikona emri={ikonat.djathtas} madhesia={14} ngjyra={ngjyrat.tekstiZbehte} />
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={
          produktet.isPending ? (
            <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
          ) : (
            <View style={styles.bosh}>
              <Ikona emri={ikonat.dhurate} madhesia={30} ngjyra={ngjyrat.ari} />
              <Text style={styles.boshTeksti}>{t("dyqani.boshStafi")}</Text>
            </View>
          )
        }
      />
      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("dyqani.shtoProdukt")} ikona={ikonat.shto} onPress={() => router.push("/menaxho/produkti")} />
      </View>
    </View>
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
      gap: hapesira.sm,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.sm,
      paddingRight: hapesira.md,
    },
    joAktiv: {
      opacity: 0.55,
    },
    shtypur: {
      opacity: 0.8,
    },
    fotoKutia: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    foto: {
      width: "86%",
      height: "86%",
    },
    teksti: {
      flex: 1,
      gap: 2,
    },
    emri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    detaje: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    cmimi: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
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
      lineHeight: 21,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
  });
