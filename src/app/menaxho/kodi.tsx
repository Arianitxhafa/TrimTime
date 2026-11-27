import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKrijoKodinERivendosjes } from "../../api/rivendosja";
import Butoni from "../../components/Butoni";
import FushaETelefonit from "../../components/FushaETelefonit";
import { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet } from "../../context/TemaContext";
import { numriNderkombetar, PREFIKSET, type Prefiksi } from "../../lib/telefoni";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

// Pronari krijon kodin për klientin që ka harruar fjalëkalimin. Kodin ia jep klientit vetë
// (në Studio ose në telefon), pasi e ka njohur.
export default function KodiIRivendosjes() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const krijo = useKrijoKodinERivendosjes();
  const [prefiksi, setPrefiksi] = useState<Prefiksi>(PREFIKSET[0]);
  const [numri, setNumri] = useState("");
  const [provuar, setProvuar] = useState(false);

  const telefoni = numriNderkombetar(prefiksi.prefiksi, numri);
  const gabimi = krijo.error
    ? (krijo.error as { code?: string }).code === "TT012"
      ? t("rivendosja.paLlogari")
      : t("pergjithshme.gabimPapritur")
    : null;

  function krijoKodin() {
    setProvuar(true);
    if (!telefoni) return;
    krijo.mutate(telefoni);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xl }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.teksti}>{t("rivendosja.stafiTeksti")}</Text>

        {krijo.data ? (
          <View style={styles.karta}>
            <Text style={styles.etiketa}>{t("rivendosja.kodiPer", { telefoni })}</Text>
            <Text style={styles.kodi} selectable accessibilityLabel={krijo.data.split("").join(" ")}>
              {krijo.data.slice(0, 3)} {krijo.data.slice(3)}
            </Text>
            <Text style={styles.afati}>{t("rivendosja.afati")}</Text>
            <Butoni
              titulli={t("rivendosja.ndaj")}
              varianti="dytesor"
              ikona={ikonat.ndaj}
              onPress={() => void Share.share({ message: t("rivendosja.mesazhi", { kodi: krijo.data }) })}
            />
            <Butoni titulli={t("rivendosja.mbaroi")} onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <GabimiIFormes mesazhi={gabimi} />
            <FushaETelefonit
              prefiksi={prefiksi}
              onPrefiksi={setPrefiksi}
              numri={numri}
              onNumri={(n) => {
                setNumri(n);
                krijo.reset();
              }}
              gabimi={provuar && !telefoni ? t("auth.gabimTelefoni") : null}
              onSubmitEditing={krijoKodin}
            />
            <Butoni titulli={t("rivendosja.krijoKodin")} ikona={ikonat.dryni} ngarkohet={krijo.isPending} onPress={krijoKodin} />
          </>
        )}
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
      gap: hapesira.md,
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: hapesira.sm,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.xl,
      gap: hapesira.md,
      alignItems: "stretch",
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
    },
    kodi: {
      ...shkronjat.titull,
      color: ngjyrat.ari,
      fontSize: 48,
      letterSpacing: 6,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    afati: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      textAlign: "center",
      marginBottom: hapesira.sm,
    },
  });
