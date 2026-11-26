import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FOTOT_E_STUDIOS } from "../lib/studio";
import Marka from "./Marka";

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
      {/* Një punim i Studios sipër, që zbehet te sfondi. */}
      <View style={styles.foto} pointerEvents="none">
        <Image source={FOTOT_E_STUDIOS[1]} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.05)", ngjyrat.sfondi]} locations={[0, 0.3, 0.72]} style={StyleSheet.absoluteFill} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.permbajtja,
          { paddingTop: insets.top + hapesira.xxl, paddingBottom: insets.bottom + hapesira.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.marka}>
          <Marka />
        </View>

        <Animated.View entering={FadeInDown.duration(450)}>
          <Text style={styles.titulli}>{titulli}</Text>
          <Text style={styles.nentitulli}>{nentitulli}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.forma}>
          {children}
        </Animated.View>

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
    foto: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 340,
    },
    marka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginTop: 120,
      marginBottom: hapesira.xxl,
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
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 20,
      letterSpacing: -0.3,
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 32,
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
