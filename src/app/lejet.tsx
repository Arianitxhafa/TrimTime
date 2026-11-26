import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import Marka from "../components/Marka";
import Xham from "../components/Xham";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { gjendjaENjoftimeve, kerkoLejenENjoftimeve, type GjendjaELejes } from "../lib/kujtesat";
import { prekja } from "../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";

// Pas hyrjes së parë, një herë në këtë telefon: leja për njoftimet (kujtesa para terminit, konfirmimi,
// ora e lirë nga lista e pritjes). Është opsionale; "Jo tani" vazhdon pa to.
export default function Lejet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { perfundoLejet } = usePreferencat();
  const [gjendja, setGjendja] = useState<GjendjaELejes | null>(null);
  const [nePritje, setNePritje] = useState(false);

  // Kush i ka vendosur njoftimet më parë (p.sh. në versionin e kaluar) nuk e sheh këtë ekran.
  useEffect(() => {
    let aktiv = true;
    gjendjaENjoftimeve()
      .catch((): GjendjaELejes => "pa_pyetur")
      .then((g) => {
        if (!aktiv) return;
        if (g !== "pa_pyetur") perfundoLejet();
        else setGjendja(g);
      });
    return () => {
      aktiv = false;
    };
  }, [perfundoLejet]);

  async function lejo() {
    if (gjendja === "refuzuar" && Platform.OS !== "web") {
      void Linking.openSettings();
      return;
    }
    setNePritje(true);
    const e_re = await kerkoLejenENjoftimeve().catch((): GjendjaELejes => "refuzuar");
    setNePritje(false);
    if (e_re === "lejuar") prekja.sukses();
    perfundoLejet();
  }

  if (gjendja === null) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg }]}>
      <Marka madhesia={24} />

      <View style={styles.qendra}>
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <Xham style={styles.disku} ngjyrimi={ngjyrat.blu}>
            <Ikona emri={ikonat.zile} madhesia={46} ngjyra="#FFFFFF" />
          </Xham>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(90).duration(380)} style={styles.titulli}>
          {t("lejet.njoftimetTitulli")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(160).duration(380)} style={styles.teksti}>
          {t("lejet.njoftimetTeksti")}
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(220).duration(380)}
        style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}
      >
        <Text style={styles.shenimi}>{t("lejet.njoftimetShenimi")}</Text>
        <Butoni titulli={t("lejet.lejoNjoftimet")} ikona={ikonat.zile} ngarkohet={nePritje} onPress={() => void lejo()} />
        <Pressable
          accessibilityRole="button"
          onPress={perfundoLejet}
          hitSlop={8}
          style={({ pressed }) => [styles.dytesor, pressed && styles.shtypur]}
        >
          <Text style={styles.dytesorTeksti}>{t("lejet.joTani")}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
      paddingHorizontal: hapesira.xl,
    },
    qendra: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.md,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    disku: {
      width: 124,
      height: 124,
      borderRadius: 62,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.lg,
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.6,
      textAlign: "center",
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 17,
      lineHeight: 24,
      textAlign: "center",
    },
    fundi: {
      gap: hapesira.md,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    shenimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
    dytesor: {
      alignSelf: "center",
      paddingVertical: 6,
    },
    shtypur: {
      opacity: 0.6,
    },
    dytesorTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
    },
  });
