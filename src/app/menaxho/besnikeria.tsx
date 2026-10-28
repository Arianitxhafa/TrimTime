import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm, usePerditesoLokalin } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import type { Lokali } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const VIZITAT = [5, 6, 8, 10, 12, 15];

export default function Besnikeria() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokali = useLokaliIm().data?.lokali;

  if (!lokali) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Forma lokali={lokali} />;
}

function Forma({ lokali }: { lokali: Lokali }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const perditeso = usePerditesoLokalin(lokali.id);
  const [aktive, setAktive] = useState(lokali.besnikeria_aktive);
  const [vizita, setVizita] = useState(lokali.besnikeria_vizita);
  const [shperblimi, setShperblimi] = useState(lokali.besnikeria_shperblimi ?? "");
  const [provuar, setProvuar] = useState(false);

  const gabimi = aktive && shperblimi.trim().length < 2 ? t("besnikeria.gabimShperblimi") : null;

  function ruaj() {
    setProvuar(true);
    if (gabimi) return;
    perditeso.mutate(
      { besnikeria_aktive: aktive, besnikeria_vizita: vizita, besnikeria_shperblimi: shperblimi.trim() || null },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <View style={styles.parapamja}>
          <View style={styles.parapamjaIkona}>
            <Ikona emri={ikonat.dhurate} madhesia={26} ngjyra={ngjyrat.mbiAri} />
          </View>
          <Text style={styles.parapamjaTitulli}>{lokali.emri}</Text>
          <Text style={styles.parapamjaRregulli}>
            {t("besnikeria.rregulli", {
              numri: vizita,
              shperblimi: shperblimi.trim() || t("besnikeria.shperblimiShembull"),
            })}
          </Text>
          <View style={styles.pikat}>
            {Array.from({ length: vizita }, (_, i) => (
              <View key={i} style={[styles.pika, i < Math.min(3, vizita - 1) && styles.pikaEMbushur]} />
            ))}
          </View>
        </View>

        <GabimiIFormes mesazhi={perditeso.isError ? t("pergjithshme.gabimPapritur") : null} />

        <View style={styles.rreshtiSwitch}>
          <View style={styles.switchTekstet}>
            <Text style={styles.switchTeksti}>{t("besnikeria.aktive")}</Text>
            <Text style={styles.switchPershkrimi}>{t("besnikeria.aktiveTeksti")}</Text>
          </View>
          <Switch
            value={aktive}
            onValueChange={setAktive}
            trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t("besnikeria.aktive")}
          />
        </View>

        <Text style={styles.etiketa}>{t("besnikeria.vizita")}</Text>
        <View style={styles.chipet}>
          {VIZITAT.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ selected: vizita === n }}
              onPress={() => setVizita(n)}
              style={[styles.chip, vizita === n && styles.chipAktiv]}
            >
              <Text style={[styles.chipTeksti, vizita === n && styles.chipTekstiAktiv]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <FushaTekstit
          etiketa={t("besnikeria.shperblimi")}
          value={shperblimi}
          onChangeText={setShperblimi}
          placeholder={t("besnikeria.shperblimiShembull")}
          maxLength={80}
          gabimi={provuar ? gabimi : null}
        />
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("besnikeria.ruaj")} ngarkohet={perditeso.isPending} onPress={ruaj} />
      </View>
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
    },
    permbajtja: {
      padding: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    parapamja: {
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.ariIErret,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.ari,
      padding: hapesira.xl,
      marginBottom: hapesira.xl,
    },
    parapamjaIkona: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    parapamjaTitulli: {
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "800",
    },
    parapamjaRregulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
    },
    pikat: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: hapesira.sm,
    },
    pika: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: ngjyrat.ari,
    },
    pikaEMbushur: {
      backgroundColor: ngjyrat.ari,
    },
    rreshtiSwitch: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginBottom: hapesira.lg,
    },
    switchTekstet: {
      flex: 1,
      gap: 2,
    },
    switchTeksti: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "600",
    },
    switchPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: hapesira.sm,
    },
    chipet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    chip: {
      minWidth: 48,
      paddingHorizontal: 14,
      height: 38,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    chipTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
