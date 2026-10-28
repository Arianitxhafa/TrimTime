import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mesazhiIGabimitTeRezervimit, useTerminetEMia } from "../../api/terminet";
import { useVleresoTerminin } from "../../api/vleresimet";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import Yjet from "../../components/Yjet";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoDaten } from "../../lib/datat";
import type { TerminiIKlientit } from "../../lib/tipet";
import { hapesira, type Ngjyrat } from "../../theme";

export default function Vlereso() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { terminiId } = useLocalSearchParams<{ terminiId: string }>();
  const terminet = useTerminetEMia();
  const termini = terminet.data?.find((x) => x.id === terminiId);

  if (!termini) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Forma termini={termini} />;
}

function Forma({ termini }: { termini: TerminiIKlientit }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const vlereso = useVleresoTerminin();
  const [yjet, setYjet] = useState(termini.vleresimi_yjet ?? 0);
  const [komenti, setKomenti] = useState("");

  if (vlereso.isSuccess) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <View style={styles.suksesIkona}>
          <Ikona emri={ikonat.yll} madhesia={34} ngjyra={ngjyrat.ari} />
        </View>
        <Text style={styles.titulli}>{t("vleresimet.faleminderit")}</Text>
        <Yjet vlera={yjet} madhesia={22} />
        <View style={styles.suksesButoni}>
          <Butoni titulli={t("termini.kthehu")} ikona={ikonat.kthe} onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulli}>{t("vleresimet.vleresoTitulli")}</Text>
        <Text style={styles.nentitulli}>
          {t("vleresimet.vleresoTeksti", { sherbimi: termini.sherbimi_emri, lokali: termini.lokali_emri })}
          {" · "}
          {formatoDaten(termini.data_lokale, t)}
        </Text>

        <View style={styles.yjet}>
          <Yjet vlera={yjet} madhesia={40} onChange={setYjet} />
          <Text style={styles.etiketa}>{yjet > 0 ? t(`vleresimet.yjet${yjet as 1 | 2 | 3 | 4 | 5}`) : " "}</Text>
        </View>

        <FushaTekstit
          etiketa={t("vleresimet.komenti")}
          placeholder={t("vleresimet.komentiShembull")}
          value={komenti}
          onChangeText={setKomenti}
          maxLength={1000}
          shumeRreshta
        />

        <GabimiIFormes mesazhi={vlereso.isError ? mesazhiIGabimitTeRezervimit(vlereso.error, t) : null} />

        <Butoni
          titulli={t("vleresimet.dergo")}
          ikona={ikonat.yll}
          joAktiv={yjet === 0}
          ngarkohet={vlereso.isPending}
          onPress={() => vlereso.mutate({ terminiId: termini.id, yjet, komenti })}
        />
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
    qendra: {
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.md,
      padding: hapesira.xxl,
    },
    permbajtja: {
      padding: hapesira.xl,
      gap: hapesira.lg,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    nentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
      marginTop: -hapesira.sm,
    },
    yjet: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.lg,
    },
    etiketa: {
      color: ngjyrat.ari,
      fontSize: 16,
      fontWeight: "700",
    },
    suksesIkona: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    suksesButoni: {
      alignSelf: "stretch",
      marginTop: hapesira.lg,
    },
  });
