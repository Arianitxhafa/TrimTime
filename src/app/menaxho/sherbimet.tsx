import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
import { useSherbimet } from "../../api/sherbimet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function MenaxhoSherbimet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const lokaliIm = useLokaliIm();
  const sherbimet = useSherbimet(lokaliIm.data?.lokali.id);

  if (!sherbimet.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sherbimet.data}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.bosh}>
            <Ikona emri={ikonat.gershere} madhesia={32} ngjyra={ngjyrat.ari} />
            <Text style={styles.boshTitulli}>{t("sherbimet.bosh")}</Text>
            <Text style={styles.boshTeksti}>{t("sherbimet.boshTeksti")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/menaxho/sherbimi", params: { id: item.id } })}
            style={({ pressed }) => [styles.karta, !item.aktiv && styles.joAktiv, pressed && styles.shtypur]}
          >
            <View style={styles.kartaTeksti}>
              <Text style={styles.emri}>{item.emri}</Text>
              <Text style={styles.detaje}>
                {formatoKohezgjatjen(item.kohezgjatja_min)}
                {!item.aktiv ? ` · ${t("sherbimet.joAktiv")}` : ""}
              </Text>
            </View>
            <Text style={styles.cmimi}>{formatoCmimin(item.cmimi_centa)}</Text>
            <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />
          </Pressable>
        )}
      />
      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("sherbimet.shto")} ikona={ikonat.shto} onPress={() => router.push("/menaxho/sherbimi")} />
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
    qendra: {
      alignItems: "center",
      justifyContent: "center",
    },
    lista: {
      padding: hapesira.xl,
      gap: hapesira.sm,
    },
    karta: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
    },
    joAktiv: {
      opacity: 0.55,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    kartaTeksti: {
      flex: 1,
      gap: 3,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    detaje: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    cmimi: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl * 2,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
