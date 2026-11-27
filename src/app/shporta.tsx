import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePorosit } from "../api/dyqani";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import Ikona, { ikonat } from "../components/Ikona";
import { GabimiIFormes } from "../components/KornizaAuth";
import { useShporta } from "../context/ShportaContext";
import { useStilet, useTema } from "../context/TemaContext";
import { formatoCmimin } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

// Shporta: artikujt me sasi, shënimi dhe "Porosit". Porosia merret dhe paguhet në Studio.
export default function Shporta() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const shporta = useShporta();
  const porosit = usePorosit();
  const [shenime, setShenime] = useState("");
  const [uPorosit, setUPorosit] = useState(false);
  const kodiIGabimit = (porosit.error as { code?: string } | null)?.code;
  const gabimi = !porosit.isError
    ? null
    : kodiIGabimit === "TT011"
      ? t("dyqani.gabimStoku")
      : kodiIGabimit === "TT009"
        ? t("rezervimi.gabimAprovimi")
        : kodiIGabimit === "TT010"
          ? t("dyqani.gabimProdukti")
          : t("pergjithshme.gabimPapritur");

  function dergo() {
    porosit.mutate(
      {
        artikujt: shporta.artikujt.map((a) => ({ produkti_id: a.produkti.id, sasia: a.sasia })),
        shenime: shenime.trim() || null,
      },
      {
        onSuccess: () => {
          prekja.sukses();
          shporta.pastro();
          setUPorosit(true);
        },
        onError: () => prekja.gabim(),
      },
    );
  }

  if (uPorosit) {
    return (
      <View style={[styles.container, styles.suksesi, { paddingBottom: insets.bottom + hapesira.xl }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.suksesiRrethi}>
          <Ikona emri={ikonat.konfirmo} madhesia={46} ngjyra={ngjyrat.mbiAri} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.suksesiTitulli}>
          {t("dyqani.uPorosit")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220)} style={styles.suksesiTeksti}>
          {t("dyqani.uPorositTeksti")}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.suksesiButonat}>
          <Butoni
            titulli={t("dyqani.porositeEMia")}
            ikona={ikonat.shenime}
            onPress={() => {
              router.back();
              router.push("/porosite");
            }}
          />
          <Butoni titulli={t("dyqani.vazhdo")} varianti="dytesor" onPress={() => router.back()} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 160 }]} keyboardShouldPersistTaps="handled">
        {shporta.artikujt.length === 0 ? (
          <View style={styles.bosh}>
            <Ikona emri={ikonat.dhurate} madhesia={32} ngjyra={ngjyrat.ari} />
            <Text style={styles.boshTeksti}>{t("dyqani.shportaBosh")}</Text>
          </View>
        ) : (
          shporta.artikujt.map((a, i) => (
            <Animated.View
              key={a.produkti.id}
              entering={FadeInDown.delay(i * 50).duration(350)}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition}
              style={styles.artikulli}
            >
              <View style={styles.fotoKutia}>
                {a.produkti.foto_url ? (
                  <Image source={{ uri: a.produkti.foto_url }} style={styles.foto} contentFit="contain" />
                ) : (
                  <Ikona emri={ikonat.dhurate} madhesia={22} ngjyra={ngjyrat.tekstiZbehte} />
                )}
              </View>
              <View style={styles.teksti}>
                <Text style={styles.emri} numberOfLines={2}>
                  {a.produkti.emri}
                </Text>
                <Text style={styles.cmimi}>{formatoCmimin(a.produkti.cmimi_centa * a.sasia)}</Text>
              </View>
              <View style={styles.sasia}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("dyqani.mePak")}
                  onPress={() => {
                    prekja.zgjedhje();
                    shporta.ndryshoSasine(a.produkti.id, a.sasia - 1);
                  }}
                  style={styles.sasiaButoni}
                >
                  <Text style={styles.sasiaShenja}>{a.sasia === 1 ? "×" : "−"}</Text>
                </Pressable>
                <Text style={styles.sasiaNumri}>{a.sasia}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("dyqani.meShume")}
                  onPress={() => {
                    prekja.zgjedhje();
                    shporta.ndryshoSasine(a.produkti.id, a.sasia + 1);
                  }}
                  style={styles.sasiaButoni}
                >
                  <Text style={styles.sasiaShenja}>+</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))
        )}

        {shporta.artikujt.length > 0 ? (
          <View style={styles.shenimet}>
            <FushaTekstit
              etiketa={t("dyqani.shenime")}
              value={shenime}
              onChangeText={setShenime}
              placeholder={t("dyqani.shenimeShembull")}
              maxLength={500}
              shumeRreshta
            />
            <Text style={styles.info}>{t("dyqani.merreNeStudio")}</Text>
          </View>
        ) : null}
      </ScrollView>

      {shporta.artikujt.length > 0 ? (
        <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
          <GabimiIFormes mesazhi={gabimi} />
          <View style={styles.totaliRreshti}>
            <Text style={styles.totaliEtiketa}>{t("rezervimi.totali")}</Text>
            <Animated.Text key={shporta.totali} entering={ZoomIn.springify()} style={styles.totali}>
              {formatoCmimin(shporta.totali)}
            </Animated.Text>
          </View>
          <Butoni titulli={t("dyqani.porosit")} ikona={ikonat.konfirmo} ngarkohet={porosit.isPending} onPress={dergo} />
        </View>
      ) : null}
    </View>
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
      gap: hapesira.md,
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
    artikulli: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.sm,
    },
    fotoKutia: {
      width: 64,
      height: 64,
      borderRadius: 16,
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
      fontSize: 15,
    },
    cmimi: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.ari,
      fontSize: 15,
    },
    sasia: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sasiaButoni: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    sasiaShenja: {
      color: ngjyrat.ari,
      fontSize: 18,
      fontWeight: "700",
    },
    sasiaNumri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
      minWidth: 18,
      textAlign: "center",
    },
    shenimet: {
      marginTop: hapesira.md,
    },
    info: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      gap: hapesira.sm,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    totaliRreshti: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    totaliEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
    totali: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
    },
    suksesi: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.xl,
      gap: hapesira.md,
    },
    suksesiRrethi: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    suksesiTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 28,
      textAlign: "center",
    },
    suksesiTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 22,
      textAlign: "center",
    },
    suksesiButonat: {
      alignSelf: "stretch",
      gap: hapesira.sm,
      marginTop: hapesira.lg,
    },
  });
