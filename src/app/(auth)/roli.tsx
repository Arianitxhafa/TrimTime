import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import Marka, { Drita } from "../../components/Marka";
import { usePreferencat, type Modi } from "../../context/PreferencatContext";
import { prekja } from "../../lib/prekja";
import { useStilet, useTema } from "../../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const rolet = [
  { vlera: "klient", titulli: "roli.klient", teksti: "roli.klientTeksti", ikona: ikonat.gershere },
  { vlera: "biznes", titulli: "roli.biznes", teksti: "roli.biznesTeksti", ikona: ikonat.lokali },
] as const satisfies readonly { vlera: Modi; titulli: string; teksti: string; ikona: EmriIkones }[];

// Përdoruesi zgjedh rolin para hyrjes; regjistrimi e ruan në llogari.
export default function ZgjidhRolin() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { ndryshoModin } = usePreferencat();

  function zgjidh(roli: Modi) {
    prekja.lehte();
    ndryshoModin(roli);
    router.push("/hyrja");
  }

  return (
    <View style={styles.container}>
    <Drita lartesia={420} />
    <ScrollView
      contentContainerStyle={[
        styles.permbajtja,
        { paddingTop: insets.top + hapesira.xxl, paddingBottom: insets.bottom + hapesira.xl },
      ]}
    >
      <View style={styles.marka}>
        <Marka />
      </View>

      <Text style={styles.titulli}>{t("roli.titulli")}</Text>
      <Text style={styles.nentitulli}>{t("roli.nentitulli")}</Text>

      <View style={styles.rolet}>
        {rolet.map((r) => (
          <Pressable
            key={r.vlera}
            accessibilityRole="button"
            onPress={() => zgjidh(r.vlera)}
            style={({ pressed }) => [styles.karta, pressed && styles.shtypur]}
          >
            <View style={styles.ikona}>
              <Ikona emri={r.ikona} madhesia={26} ngjyra={ngjyrat.mbiAri} />
            </View>
            <View style={styles.teksti}>
              <Text style={styles.kartaTitulli}>{t(r.titulli)}</Text>
              <Text style={styles.kartaTeksti}>{t(r.teksti)}</Text>
            </View>
            <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
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
      flexGrow: 1,
      paddingHorizontal: hapesira.xl,
      width: "100%",
      maxWidth: 480,
      alignSelf: "center",
    },
    marka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginBottom: hapesira.xxl * 1.5,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    emriMarkes: {
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -0.6,
    },
    nentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
      marginTop: 6,
      marginBottom: hapesira.xxl,
    },
    rolet: {
      gap: hapesira.md,
    },
    karta: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
    },
    shtypur: {
      borderColor: ngjyrat.ari,
      backgroundColor: ngjyrat.ariIErret,
    },
    ikona: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    teksti: {
      flex: 1,
      gap: 4,
    },
    kartaTitulli: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    kartaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
  });
