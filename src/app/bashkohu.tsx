import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { usePranoFtesen } from "../api/stafi";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import { useStilet } from "../context/TemaContext";
import { hapesira, type Ngjyrat } from "../theme";

export default function Bashkohu() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const prano = usePranoFtesen();
  // Nga skaneri i QR-së vjen kodi i plotësuar.
  const { kodi: kodiNgaQr } = useLocalSearchParams<{ kodi?: string }>();
  const [kodi, setKodi] = useState(kodiNgaQr?.toUpperCase().slice(0, 8) ?? "");

  const iPlote = /^[A-Z2-9]{8}$/.test(kodi);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulli}>{t("stafi.bashkohuTitulli")}</Text>
        <Text style={styles.teksti}>{t("stafi.bashkohuTeksti")}</Text>
        <FushaTekstit
          etiketa={t("stafi.kodi")}
          ikona={ikonat.dryni}
          value={kodi}
          onChangeText={(v) => setKodi(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
          placeholder="ABCD2345"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          gabimi={prano.isError ? t("stafi.gabimKodi") : null}
        />
        <Butoni
          titulli={t("stafi.bashkohu")}
          joAktiv={!iPlote}
          ngarkohet={prano.isPending}
          onPress={() => prano.mutate(kodi, { onSuccess: () => router.back() })}
        />
        <Text style={styles.ose}>{t("qr.ftesaQr")}</Text>
        <Butoni titulli={t("qr.skano")} varianti="dytesor" ikona={ikonat.skano} onPress={() => router.push("/skano")} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 6,
      marginBottom: hapesira.xl,
    },
    ose: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      textAlign: "center",
      marginTop: hapesira.xl,
      marginBottom: hapesira.sm,
    },
  });
