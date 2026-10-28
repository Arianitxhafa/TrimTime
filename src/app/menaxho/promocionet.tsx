import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLokaliIm } from "../../api/lokalet";
import { usePromocionet } from "../../api/promocionet";
import { useSherbimet } from "../../api/sherbimet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { pershkrimiIPromocionit } from "../../lib/promocionet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function Promocionet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokaliId = useLokaliIm().data?.lokali.id;
  const promocionet = usePromocionet(lokaliId);
  const sherbimet = useSherbimet(lokaliId);

  if (!promocionet.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      {promocionet.data.length === 0 ? (
        <View style={styles.bosh}>
          <View style={styles.boshIkona}>
            <Ikona emri={ikonat.etiketa} madhesia={28} ngjyra={ngjyrat.ari} />
          </View>
          <Text style={styles.boshTitulli}>{t("promocionet.boshTitulli")}</Text>
          <Text style={styles.boshTeksti}>{t("promocionet.boshTeksti")}</Text>
        </View>
      ) : (
        <View style={styles.grupi}>
          {promocionet.data.map((p, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/menaxho/promocioni", params: { id: p.id } })}
              style={({ pressed }) => [styles.rreshti, i > 0 && styles.meKufi, pressed && styles.shtypur]}
            >
              <View style={[styles.perqindja, !p.aktiv && styles.joAktiv]}>
                <Text style={styles.perqindjaTeksti}>{t("promocionet.etiketa", { perqindja: p.perqindja })}</Text>
              </View>
              <View style={styles.teksti}>
                <Text style={[styles.titulli, !p.aktiv && styles.titulliJoAktiv]} numberOfLines={1}>
                  {p.titulli}
                  {p.aktiv ? "" : ` · ${t("promocionet.joAktiv")}`}
                </Text>
                <Text style={styles.pershkrimi} numberOfLines={2}>
                  {pershkrimiIPromocionit(p, t, sherbimet.data ?? [])}
                </Text>
              </View>
              <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />
            </Pressable>
          ))}
        </View>
      )}

      <Butoni titulli={t("promocionet.shto")} ikona={ikonat.shto} onPress={() => router.push("/menaxho/promocioni")} />
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
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    meKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    perqindja: {
      minWidth: 58,
      height: 34,
      paddingHorizontal: 8,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    joAktiv: {
      backgroundColor: ngjyrat.kufiri,
    },
    perqindjaTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 14,
      fontWeight: "800",
    },
    teksti: {
      flex: 1,
      gap: 3,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    titulliJoAktiv: {
      color: ngjyrat.tekstiZbehte,
    },
    pershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xl,
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
    },
  });
