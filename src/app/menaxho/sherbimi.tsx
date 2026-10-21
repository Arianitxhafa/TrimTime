import type { PostgrestError } from "@supabase/supabase-js";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
import { useLokaliIm } from "../../api/lokalet";
import { useFshiSherbimin, useRuajSherbimin, useSherbimet } from "../../api/sherbimet";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import FushaTekstit from "../../components/FushaTekstit";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoKohezgjatjen, lexoCmimin } from "../../lib/formatimi";
import type { Sherbimi } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const KOHEZGJATJET = [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120];

export default function FormaESherbimit() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const sherbimet = useSherbimet(lokaliId);

  if (!lokaliId || !sherbimet.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  const ekzistues = id ? sherbimet.data.find((s) => s.id === id) : undefined;
  return <Forma lokaliId={lokaliId} sherbimi={ekzistues} renditjaERe={sherbimet.data.length} />;
}

type FormaProps = { lokaliId: string; sherbimi?: Sherbimi; renditjaERe: number };

function Forma({ lokaliId, sherbimi, renditjaERe }: FormaProps) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const ruaj = useRuajSherbimin(lokaliId);
  const fshi = useFshiSherbimin(lokaliId);

  const [emri, setEmri] = useState(sherbimi?.emri ?? "");
  const [cmimi, setCmimi] = useState(sherbimi ? String(sherbimi.cmimi_centa / 100).replace(".", ",") : "");
  const [kohezgjatja, setKohezgjatja] = useState(sherbimi?.kohezgjatja_min ?? 30);
  const [pershkrimi, setPershkrimi] = useState(sherbimi?.pershkrimi ?? "");
  const [aktiv, setAktiv] = useState(sherbimi?.aktiv ?? true);
  const [provuar, setProvuar] = useState(false);
  const [dialogu, setDialogu] = useState(false);

  const cmimiCenta = lexoCmimin(cmimi);
  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("sherbimet.gabimEmri"),
    cmimi: cmimiCenta !== null ? null : t("sherbimet.gabimCmimi"),
  };

  function ruajSherbimin() {
    setProvuar(true);
    if (gabimet.emri || cmimiCenta === null) return;
    ruaj.mutate(
      {
        id: sherbimi?.id,
        emri: emri.trim(),
        cmimi_centa: cmimiCenta,
        kohezgjatja_min: kohezgjatja,
        pershkrimi: pershkrimi.trim() || null,
        aktiv,
        ...(sherbimi ? {} : { renditja: renditjaERe }),
      },
      { onSuccess: () => router.back() },
    );
  }

  // 23503: shërbimi lidhet me termine ekzistuese (foreign key), ndaj nuk fshihet.
  const gabimiFshirjes = fshi.error
    ? (fshi.error as unknown as PostgrestError).code === "23503"
      ? t("sherbimet.gabimNePerdorim")
      : t("pergjithshme.gabimPapritur")
    : null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: t(sherbimi ? "sherbimet.ndrysho" : "sherbimet.iRi") }} />
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <GabimiIFormes mesazhi={ruaj.isError ? t("pergjithshme.gabimPapritur") : gabimiFshirjes} />
        <FushaTekstit
          etiketa={t("sherbimet.emri")}
          value={emri}
          onChangeText={setEmri}
          placeholder={t("sherbimet.emriShembull")}
          maxLength={80}
          gabimi={provuar ? gabimet.emri : null}
        />
        <FushaTekstit
          etiketa={t("sherbimet.cmimi")}
          value={cmimi}
          onChangeText={setCmimi}
          placeholder="8,50"
          keyboardType="decimal-pad"
          maxLength={8}
          gabimi={provuar ? gabimet.cmimi : null}
        />

        <Text style={styles.etiketa}>{t("sherbimet.kohezgjatja")}</Text>
        <View style={styles.kohet}>
          {KOHEZGJATJET.map((min) => {
            const zgjedhur = kohezgjatja === min;
            return (
              <Pressable
                key={min}
                accessibilityRole="radio"
                accessibilityState={{ selected: zgjedhur }}
                onPress={() => setKohezgjatja(min)}
                style={[styles.koha, zgjedhur && styles.kohaZgjedhur]}
              >
                <Text style={[styles.kohaTeksti, zgjedhur && styles.kohaTekstiZgjedhur]}>
                  {formatoKohezgjatjen(min)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FushaTekstit
          etiketa={t("sherbimet.pershkrimi")}
          value={pershkrimi}
          onChangeText={setPershkrimi}
          shumeRreshta
          maxLength={500}
        />

        <View style={styles.aktiv}>
          <Text style={styles.aktivTeksti}>{t("sherbimet.aktiv")}</Text>
          <Switch
            value={aktiv}
            onValueChange={setAktiv}
            trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t("sherbimet.aktiv")}
          />
        </View>

        {sherbimi && (
          <Butoni
            titulli={t("sherbimet.fshi")}
            varianti="rrezik"
            ngarkohet={fshi.isPending}
            onPress={() => setDialogu(true)}
          />
        )}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("sherbimet.ruaj")} ngarkohet={ruaj.isPending} onPress={ruajSherbimin} />
      </View>

      {sherbimi && (
        <DialogKonfirmimi
          iDukshem={dialogu}
          titulli={t("sherbimet.fshiTitulli")}
          mesazhi={t("sherbimet.fshiMesazhi", { emri: sherbimi.emri })}
          tekstiKonfirmimit={t("sherbimet.fshiKonfirmo")}
          rrezik
          onAnulo={() => setDialogu(false)}
          onKonfirmo={() => {
            setDialogu(false);
            fshi.mutate(sherbimi.id, { onSuccess: () => router.back() });
          }}
        />
      )}
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
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: hapesira.sm,
    },
    kohet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    koha: {
      paddingHorizontal: 14,
      height: 38,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      justifyContent: "center",
    },
    kohaZgjedhur: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    kohaTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    kohaTekstiZgjedhur: {
      color: ngjyrat.mbiAri,
    },
    aktiv: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginBottom: hapesira.xl,
    },
    aktivTeksti: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "600",
      flex: 1,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
