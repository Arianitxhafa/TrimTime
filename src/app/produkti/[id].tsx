import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProduktet } from "../../api/dyqani";
import Butoni from "../../components/Butoni";
import EkraniINgarkimit from "../../components/EkraniINgarkimit";
import Ikona, { ikonat } from "../../components/Ikona";
import { useShporta } from "../../context/ShportaContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoCmimin } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../../theme";

// Produkti: foto e madhe, kategoria, çmimi, përshkrimi, sasia dhe "Shto në shportë".
export default function ProduktiDetaje() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const produktet = useProduktet();
  const shporta = useShporta();
  const [sasia, setSasia] = useState(1);
  const p = produktet.data?.find((x) => x.id === id);

  if (!p) return <EkraniINgarkimit pyetjet={[produktet]} mungon={produktet.isSuccess} />;

  const kufiri = Math.min(20, p.ne_stok ?? 20);
  const mbaroi = p.ne_stok === 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <Animated.View entering={ZoomIn.springify().damping(16)} style={styles.fotoKutia}>
          {p.foto_url ? (
            <Image source={{ uri: p.foto_url }} style={styles.foto} contentFit="contain" transition={250} />
          ) : (
            <Ikona emri={ikonat.dhurate} madhesia={56} ngjyra={ngjyrat.tekstiZbehte} />
          )}
        </Animated.View>
        <View style={styles.permbajtja}>
          <Animated.Text entering={FadeInDown.delay(80)} style={styles.kategoria}>
            {t(`dyqani.kategoria_${p.kategoria}`)}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(120)} style={styles.emri}>
            {p.emri}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(160)} style={styles.cmimi}>
            {formatoCmimin(p.cmimi_centa)}
          </Animated.Text>
          {p.ne_stok !== null ? (
            <Text style={[styles.stoku, mbaroi && styles.stokuMbaroi]}>
              {mbaroi ? t("dyqani.mbaroi") : t("dyqani.neStok", { numri: p.ne_stok })}
            </Text>
          ) : null}
          {p.pershkrimi ? (
            <Animated.Text entering={FadeInDown.delay(200)} style={styles.pershkrimi}>
              {p.pershkrimi}
            </Animated.Text>
          ) : null}
          <Text style={styles.shenimi}>{t("dyqani.merreNeStudio")}</Text>
        </View>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <View style={styles.sasia}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("dyqani.mePak")}
            disabled={sasia <= 1}
            onPress={() => {
              prekja.zgjedhje();
              setSasia((s) => Math.max(1, s - 1));
            }}
            style={[styles.sasiaButoni, sasia <= 1 && styles.joAktiv]}
          >
            <Text style={styles.sasiaShenja}>−</Text>
          </Pressable>
          <Animated.Text key={sasia} entering={ZoomIn.duration(180)} style={styles.sasiaNumri}>
            {sasia}
          </Animated.Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("dyqani.meShume")}
            disabled={sasia >= kufiri}
            onPress={() => {
              prekja.zgjedhje();
              setSasia((s) => Math.min(kufiri, s + 1));
            }}
            style={[styles.sasiaButoni, sasia >= kufiri && styles.joAktiv]}
          >
            <Text style={styles.sasiaShenja}>+</Text>
          </Pressable>
        </View>
        <Butoni
          titulli={t("dyqani.shtoNeShporte")}
          ikona={ikonat.shto}
          joAktiv={mbaroi}
          onPress={() => {
            prekja.sukses();
            shporta.shto(p, sasia);
            router.back();
          }}
          style={styles.shto}
        />
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
    fotoKutia: {
      height: 320,
      margin: hapesira.lg,
      borderRadius: 32,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.ariIErret,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    foto: {
      width: "86%",
      height: "86%",
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    kategoria: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.ari,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 30,
      letterSpacing: -0.8,
      fontWeight: "800",
    },
    cmimi: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
    },
    stoku: {
      color: ngjyrat.jeshile,
      fontSize: 14,
      fontWeight: "600",
    },
    stokuMbaroi: {
      color: ngjyrat.rrezik,
    },
    pershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
      marginTop: hapesira.sm,
    },
    shenimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
      marginTop: hapesira.md,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    sasia: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      height: 54,
      borderRadius: 27,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      paddingHorizontal: 6,
    },
    sasiaButoni: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    sasiaShenja: {
      color: ngjyrat.ari,
      fontSize: 22,
      fontWeight: "700",
    },
    sasiaNumri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 18,
      minWidth: 24,
      textAlign: "center",
    },
    joAktiv: {
      opacity: 0.4,
    },
    shto: {
      flex: 1,
    },
  });
