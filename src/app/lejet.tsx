import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

// Pas krijimit të llogarisë: një ekran për njoftimet, me dritaren e sistemit pas butonit.
// Vendndodhja nuk kërkohet: "Udhëzimet" hapin Apple Maps ose Google Maps.
export default function Lejet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { perfundoLejet } = usePreferencat();
  const [gati, setGati] = useState(false);
  const [nePritje, setNePritje] = useState(false);

  useEffect(() => {
    let aktiv = true;
    gjendjaENjoftimeve()
      .catch((): GjendjaELejes => "pa_pyetur")
      .then((gjendja) => {
        if (!aktiv) return;
        // Kush i ka vendosur njoftimet më parë nuk e sheh më këtë ekran.
        if (gjendja !== "pa_pyetur") perfundoLejet();
        else setGati(true);
      });
    return () => {
      aktiv = false;
    };
  }, [perfundoLejet]);

  async function lejoNjoftimet() {
    setNePritje(true);
    const gjendja = await kerkoLejenENjoftimeve().catch((): GjendjaELejes => "refuzuar");
    setNePritje(false);
    if (gjendja === "lejuar") prekja.sukses();
    perfundoLejet();
  }

  // Derisa të lexohet leja, ekrani mbetet bosh (një çast).
  if (!gati) return <View style={styles.container} />;

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg }]}>
      <View style={styles.koka}>
        <Marka madhesia={24} />
      </View>

      <View style={styles.qendra}>
        <Xham style={styles.disku} ngjyrimi={ngjyrat.ari}>
          <Ikona emri={ikonat.zile} madhesia={46} ngjyra="#FFFFFF" />
        </Xham>
        <Text style={styles.titulli}>{t("lejet.njoftimetTitulli")}</Text>
        <Text style={styles.teksti}>{t("lejet.njoftimetTeksti")}</Text>
      </View>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}>
        <Text style={styles.privatesia}>{t("lejet.njoftimetShenimi")}</Text>
        <Butoni titulli={t("lejet.lejoNjoftimet")} ikona={ikonat.zile} ngarkohet={nePritje} onPress={() => void lejoNjoftimet()} />
        <Pressable
          accessibilityRole="button"
          onPress={perfundoLejet}
          hitSlop={8}
          style={({ pressed }) => [styles.dytesor, pressed && styles.shtypur]}
        >
          <Text style={styles.dytesorTeksti}>{t("lejet.joTani")}</Text>
        </Pressable>
      </View>
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
    koka: {
      flexDirection: "row",
      alignItems: "center",
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
    privatesia: {
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
