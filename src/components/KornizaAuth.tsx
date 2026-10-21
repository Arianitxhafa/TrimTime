import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  titulli: string;
  nentitulli: string;
  children: ReactNode;
  fundi?: ReactNode;
};

// Pamja e përbashkët e ekraneve të hyrjes dhe regjistrimit.
export default function KornizaAuth({ titulli, nentitulli, children, fundi }: Props) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.permbajtja,
          { paddingTop: insets.top + hapesira.xxl, paddingBottom: insets.bottom + hapesira.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.marka}>
          <View style={styles.logo}>
            <Ikona emri={ikonat.gershere} madhesia={22} ngjyra={ngjyrat.mbiAri} />
          </View>
          <Text style={styles.emriMarkes}>TrimTime</Text>
        </View>

        <Text style={styles.titulli}>{titulli}</Text>
        <Text style={styles.nentitulli}>{nentitulli}</Text>

        <View style={styles.forma}>{children}</View>

        {fundi ? <View style={styles.fundi}>{fundi}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function GabimiIFormes({ mesazhi }: { mesazhi: string | null }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  if (!mesazhi) return null;

  return (
    <View accessibilityRole="alert" style={styles.gabimi}>
      <Ikona emri={ikonat.gabim} madhesia={16} ngjyra={ngjyrat.rrezik} />
      <Text style={styles.gabimiTeksti}>{mesazhi}</Text>
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
      marginTop: 6,
      marginBottom: hapesira.xxl,
    },
    forma: {
      gap: hapesira.xs,
    },
    fundi: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: "auto",
      paddingTop: hapesira.xxl,
    },
    gabimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.rrezikSfond,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.rrezikKufiri,
      padding: hapesira.md,
      marginBottom: hapesira.lg,
    },
    gabimiTeksti: {
      flex: 1,
      color: ngjyrat.rrezik,
      fontSize: 14,
      fontWeight: "600",
    },
  });
