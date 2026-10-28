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
import { useFshiPromocionin, usePromocionet, useRuajPromocionin } from "../../api/promocionet";
import { useSherbimet } from "../../api/sherbimet";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import FushaTekstit from "../../components/FushaTekstit";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { RENDI_I_DITEVE } from "../../components/RedaktoriIOrarit";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO } from "../../lib/datat";
import type { Promocioni, Sherbimi } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const PERQINDJET = [5, 10, 15, 20, 25, 30, 40, 50];
const ORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

type CelesiIDites = `koha.d${0 | 1 | 2 | 3 | 4 | 5 | 6}`;

export default function FormaEPromocionit() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lokaliId = useLokaliIm().data?.lokali.id;
  const promocionet = usePromocionet(lokaliId);
  const sherbimet = useSherbimet(lokaliId);

  if (!lokaliId || !promocionet.data || !sherbimet.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  const ekzistues = id ? promocionet.data.find((p) => p.id === id) : undefined;
  return <Forma lokaliId={lokaliId} promocioni={ekzistues} sherbimet={sherbimet.data.filter((s) => s.aktiv)} />;
}

type FormaProps = { lokaliId: string; promocioni?: Promocioni; sherbimet: Sherbimi[] };

function Forma({ lokaliId, promocioni, sherbimet }: FormaProps) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const ruaj = useRuajPromocionin(lokaliId);
  const fshi = useFshiPromocionin(lokaliId);

  const [titulli, setTitulli] = useState(promocioni?.titulli ?? "");
  const [perqindja, setPerqindja] = useState(promocioni?.perqindja ?? 20);
  const [sherbimiId, setSherbimiId] = useState<string | null>(promocioni?.sherbimi_id ?? null);
  const [ditet, setDitet] = useState<number[] | null>(promocioni?.ditet ?? null);
  const [meOrar, setMeOrar] = useState(Boolean(promocioni?.ora_nga));
  const [oraNga, setOraNga] = useState(promocioni?.ora_nga ?? "10:00");
  const [oraDeri, setOraDeri] = useState(promocioni?.ora_deri ?? "14:00");
  const [vlenNga, setVlenNga] = useState(promocioni?.vlen_nga ?? dataISO(new Date()));
  const [vlenDeri, setVlenDeri] = useState(promocioni?.vlen_deri ?? "");
  const [aktiv, setAktiv] = useState(promocioni?.aktiv ?? true);
  const [provuar, setProvuar] = useState(false);
  const [dialogu, setDialogu] = useState(false);

  const gabimet = {
    titulli: titulli.trim().length >= 2 ? null : t("promocionet.gabimTitulli"),
    ditet: ditet === null || ditet.length > 0 ? null : t("promocionet.gabimDitet"),
    orari: !meOrar || (ORA.test(oraNga) && ORA.test(oraDeri) && oraDeri > oraNga) ? null : t("promocionet.gabimOrari"),
    data:
      DATA.test(vlenNga) && (vlenDeri.trim() === "" || (DATA.test(vlenDeri.trim()) && vlenDeri.trim() >= vlenNga))
        ? null
        : t("promocionet.gabimData"),
  };

  function ndryshoDiten(dita: number) {
    const teZgjedhura = ditet ?? [...RENDI_I_DITEVE];
    const teReja = teZgjedhura.includes(dita) ? teZgjedhura.filter((d) => d !== dita) : [...teZgjedhura, dita];
    setDitet(teReja.length === 7 ? null : teReja);
  }

  function ruajPromocionin() {
    setProvuar(true);
    if (Object.values(gabimet).some(Boolean)) return;
    ruaj.mutate(
      {
        id: promocioni?.id,
        titulli: titulli.trim(),
        perqindja,
        sherbimi_id: sherbimiId,
        ditet: ditet ? [...ditet].sort() : null,
        ora_nga: meOrar ? oraNga : null,
        ora_deri: meOrar ? oraDeri : null,
        vlen_nga: vlenNga,
        vlen_deri: vlenDeri.trim() || null,
        aktiv,
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: t(promocioni ? "promocionet.ndrysho" : "promocionet.ri") }} />
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <GabimiIFormes mesazhi={ruaj.isError || fshi.isError ? t("pergjithshme.gabimPapritur") : null} />

        <FushaTekstit
          etiketa={t("promocionet.emri")}
          value={titulli}
          onChangeText={setTitulli}
          placeholder={t("promocionet.emriShembull")}
          maxLength={60}
          gabimi={provuar ? gabimet.titulli : null}
        />

        <Text style={styles.etiketa}>{t("promocionet.perqindja")}</Text>
        <View style={styles.chipet}>
          {PERQINDJET.map((p) => (
            <Chip key={p} teksti={`${p}%`} aktiv={perqindja === p} onPress={() => setPerqindja(p)} />
          ))}
        </View>

        <Text style={styles.etiketa}>{t("promocionet.sherbimi")}</Text>
        <View style={styles.chipet}>
          <Chip teksti={t("promocionet.teGjitha")} aktiv={sherbimiId === null} onPress={() => setSherbimiId(null)} />
          {sherbimet.map((s) => (
            <Chip key={s.id} teksti={s.emri} aktiv={sherbimiId === s.id} onPress={() => setSherbimiId(s.id)} />
          ))}
        </View>

        <Text style={styles.etiketa}>{t("promocionet.ditet")}</Text>
        <View style={styles.chipet}>
          <Chip teksti={t("promocionet.cdoDite")} aktiv={ditet === null} onPress={() => setDitet(null)} />
          {RENDI_I_DITEVE.map((d) => (
            <Chip
              key={d}
              teksti={t(`koha.d${d}` as CelesiIDites)}
              aktiv={ditet !== null && ditet.includes(d)}
              onPress={() => ndryshoDiten(d)}
            />
          ))}
        </View>
        {provuar && gabimet.ditet ? <Text style={styles.gabimi}>{gabimet.ditet}</Text> : null}

        <View style={styles.rreshtiSwitch}>
          <Text style={styles.switchTeksti}>{t("promocionet.orari")}</Text>
          <Switch
            value={meOrar}
            onValueChange={setMeOrar}
            trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t("promocionet.orari")}
          />
        </View>
        {meOrar && (
          <View style={styles.dyFusha}>
            <View style={styles.fusha}>
              <FushaTekstit
                etiketa={t("promocionet.nga")}
                value={oraNga}
                onChangeText={setOraNga}
                placeholder="10:00"
                maxLength={5}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.fusha}>
              <FushaTekstit
                etiketa={t("promocionet.deri")}
                value={oraDeri}
                onChangeText={setOraDeri}
                placeholder="14:00"
                maxLength={5}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        )}
        {provuar && gabimet.orari ? <Text style={styles.gabimi}>{gabimet.orari}</Text> : null}

        <View style={styles.dyFusha}>
          <View style={styles.fusha}>
            <FushaTekstit
              etiketa={t("promocionet.vlenNga")}
              value={vlenNga}
              onChangeText={setVlenNga}
              placeholder="2026-11-01"
              maxLength={10}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.fusha}>
            <FushaTekstit
              etiketa={t("promocionet.vlenDeri")}
              value={vlenDeri}
              onChangeText={setVlenDeri}
              placeholder="2026-11-30"
              maxLength={10}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        {provuar && gabimet.data ? <Text style={styles.gabimi}>{gabimet.data}</Text> : null}

        <View style={styles.rreshtiSwitch}>
          <View style={styles.switchTekstet}>
            <Text style={styles.switchTeksti}>{t("promocionet.aktiv")}</Text>
            <Text style={styles.switchPershkrimi}>{t("promocionet.aktivTeksti")}</Text>
          </View>
          <Switch
            value={aktiv}
            onValueChange={setAktiv}
            trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
            thumbColor="#FFFFFF"
            accessibilityLabel={t("promocionet.aktiv")}
          />
        </View>

        {promocioni && (
          <Butoni titulli={t("promocionet.fshi")} varianti="rrezik" ngarkohet={fshi.isPending} onPress={() => setDialogu(true)} />
        )}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("promocionet.ruaj")} ngarkohet={ruaj.isPending} onPress={ruajPromocionin} />
      </View>

      {promocioni && (
        <DialogKonfirmimi
          iDukshem={dialogu}
          titulli={t("promocionet.fshiTitulli")}
          mesazhi={t("promocionet.fshiMesazhi")}
          tekstiKonfirmimit={t("promocionet.fshiKonfirmo")}
          rrezik
          onAnulo={() => setDialogu(false)}
          onKonfirmo={() => {
            setDialogu(false);
            fshi.mutate(promocioni.id, { onSuccess: () => router.back() });
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function Chip({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: aktiv }}
      onPress={onPress}
      style={[styles.chip, aktiv && styles.chipAktiv]}
    >
      <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{teksti}</Text>
    </Pressable>
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
    chipet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    chip: {
      paddingHorizontal: 14,
      height: 38,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
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
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      marginTop: -hapesira.sm,
      marginBottom: hapesira.lg,
    },
    rreshtiSwitch: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
      flexShrink: 1,
    },
    switchPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    dyFusha: {
      flexDirection: "row",
      gap: hapesira.md,
    },
    fusha: {
      flex: 1,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
