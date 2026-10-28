import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import Ikona, { ikonat, type EmriIkones } from "../components/Ikona";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { gjendjaENjoftimeve, kerkoLejenENjoftimeve, type GjendjaELejes } from "../lib/kujtesat";
import { prekja } from "../lib/prekja";
import { hapesira, hijet, rrezja, type Ngjyrat } from "../theme";

async function gjendjaEVendndodhjes(): Promise<GjendjaELejes> {
  const leja = await Location.getForegroundPermissionsAsync();
  return leja.granted ? "lejuar" : leja.canAskAgain ? "pa_pyetur" : "refuzuar";
}

// Shfaqet një herë pas hyrjes së parë: shpjegon pse duhen lejet, pastaj hap dritaret e sistemit.
export default function Lejet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { perfundoLejet } = usePreferencat();
  const [vendndodhja, setVendndodhja] = useState<GjendjaELejes>("pa_pyetur");
  const [njoftimet, setNjoftimet] = useState<GjendjaELejes>("pa_pyetur");

  useEffect(() => {
    gjendjaEVendndodhjes().then(setVendndodhja).catch(() => {});
    gjendjaENjoftimeve().then(setNjoftimet).catch(() => {});
  }, []);

  async function lejoVendndodhjen() {
    const leja = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const gjendja: GjendjaELejes = leja?.granted ? "lejuar" : leja?.canAskAgain === false ? "refuzuar" : "pa_pyetur";
    setVendndodhja(gjendja);
    if (gjendja === "lejuar") prekja.sukses();
  }

  async function lejoNjoftimet() {
    const gjendja = await kerkoLejenENjoftimeve().catch((): GjendjaELejes => "refuzuar");
    setNjoftimet(gjendja);
    if (gjendja === "lejuar") prekja.sukses();
  }

  const teGjithaLejuar = vendndodhja === "lejuar" && njoftimet === "lejuar";

  return (
    <View style={styles.container}>
      <LinearGradient colors={[ngjyrat.ariIErret, ngjyrat.sfondi]} style={styles.drita} />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingTop: insets.top + hapesira.xxl * 2 }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.koka}>
          <LinearGradient colors={ngjyrat.gradientiAri} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.logo, hijet.ari]}>
            <Ikona emri={ikonat.gershere} madhesia={34} ngjyra={ngjyrat.mbiAri} />
          </LinearGradient>
          <Text style={styles.titulli}>{t("lejet.titulli")}</Text>
          <Text style={styles.nentitulli}>{t("lejet.nentitulli")}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <KartaELejes
            ikona={ikonat.harta}
            titulli={t("lejet.vendndodhja")}
            teksti={t("lejet.vendndodhjaTeksti")}
            gjendja={vendndodhja}
            onLejo={lejoVendndodhjen}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250).duration(500)}>
          <KartaELejes
            ikona={ikonat.zile}
            titulli={t("lejet.njoftimet")}
            teksti={t("lejet.njoftimetTeksti")}
            gjendja={njoftimet}
            onLejo={lejoNjoftimet}
          />
        </Animated.View>

        <Text style={styles.privatesia}>{t("lejet.privatesia")}</Text>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}>
        <Butoni
          titulli={teGjithaLejuar || vendndodhja === "lejuar" ? t("lejet.vazhdo") : t("lejet.meVone")}
          varianti={teGjithaLejuar || vendndodhja === "lejuar" ? "kryesor" : "dytesor"}
          ikona={ikonat.djathtas}
          onPress={perfundoLejet}
        />
      </View>
    </View>
  );
}

type KartaProps = {
  ikona: EmriIkones;
  titulli: string;
  teksti: string;
  gjendja: GjendjaELejes;
  onLejo: () => void;
};

function KartaELejes({ ikona, titulli, teksti, gjendja, onLejo }: KartaProps) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const lejuar = gjendja === "lejuar";

  return (
    <View style={[styles.karta, lejuar && styles.kartaELejuar]}>
      <View style={styles.ikona}>
        <Ikona emri={ikona} madhesia={22} ngjyra={ngjyrat.ari} />
      </View>
      <View style={styles.kartaTeksti}>
        <Text style={styles.kartaTitulli}>{titulli}</Text>
        <Text style={styles.kartaPershkrimi}>{teksti}</Text>
      </View>
      {lejuar ? (
        <View style={styles.lejuar} accessibilityLabel={t("lejet.lejuar")}>
          <Ikona emri={ikonat.konfirmo} madhesia={18} ngjyra={statusetMeta.konfirmuar.ngjyra} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={gjendja === "refuzuar" && Platform.OS !== "web" ? () => Linking.openSettings() : onLejo}
          style={({ pressed }) => [styles.lejo, pressed && styles.shtypur]}
        >
          <Text style={styles.lejoTeksti}>{gjendja === "refuzuar" ? t("lejet.hapCilesimet") : t("lejet.lejo")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    drita: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 360,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
      gap: hapesira.md,
    },
    koka: {
      alignItems: "center",
      gap: hapesira.md,
      marginBottom: hapesira.xl,
    },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.8,
      textAlign: "center",
    },
    nentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
      textAlign: "center",
      maxWidth: 320,
    },
    karta: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
    },
    kartaELejuar: {
      borderColor: ngjyrat.ari,
    },
    ikona: {
      width: 46,
      height: 46,
      borderRadius: 15,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    kartaTeksti: {
      flex: 1,
      gap: 3,
    },
    kartaTitulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    kartaPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
    },
    lejo: {
      paddingHorizontal: 16,
      height: 38,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    shtypur: {
      opacity: 0.8,
    },
    lejoTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 14,
      fontWeight: "800",
    },
    lejuar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    privatesia: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      marginTop: hapesira.lg,
      paddingHorizontal: hapesira.lg,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
    },
  });
