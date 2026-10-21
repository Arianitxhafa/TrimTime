import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKrijoLokalin } from "../api/lokalet";
import { orariIParazgjedhur } from "../api/orari";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import Ikona, { ikonat } from "../components/Ikona";
import { GabimiIFormes } from "../components/KornizaAuth";
import RedaktoriIOrarit, { orariEshteIVlefshem } from "../components/RedaktoriIOrarit";
import ZgjedhesiVendndodhjes from "../components/ZgjedhesiVendndodhjes";
import { useStilet, useTema } from "../context/TemaContext";
import { formatoCmimin, formatoKohezgjatjen } from "../lib/formatimi";
import type { IntervaliIOrarit, Koordinata } from "../lib/tipet";
import { PRISHTINA } from "../lib/vendndodhja";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

const SHEMBUJT = [
  { celesi: "sherbimet.shembullKlasike", cmimi_centa: 800, kohezgjatja_min: 30 },
  { celesi: "sherbimet.shembullModerne", cmimi_centa: 1000, kohezgjatja_min: 40 },
  { celesi: "sherbimet.shembullMjeker", cmimi_centa: 500, kohezgjatja_min: 20 },
  { celesi: "sherbimet.shembullKombinim", cmimi_centa: 1300, kohezgjatja_min: 50 },
  { celesi: "sherbimet.shembullLarje", cmimi_centa: 400, kohezgjatja_min: 15 },
  { celesi: "sherbimet.shembullFemije", cmimi_centa: 600, kohezgjatja_min: 25 },
] as const;

const HAPAT = 4;

export default function LokaliIRi() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const krijo = useKrijoLokalin();

  const [hapi, setHapi] = useState(0);
  const [provuar, setProvuar] = useState(false);
  const [emri, setEmri] = useState("");
  const [pershkrimi, setPershkrimi] = useState("");
  const [telefoni, setTelefoni] = useState("");
  const [vendndodhja, setVendndodhja] = useState<Koordinata>(PRISHTINA);
  const [adresa, setAdresa] = useState("");
  const [qyteti, setQyteti] = useState("");
  // Adresa plotësohet nga harta derisa përdoruesi ta shkruajë vetë.
  const [adresaManuale, setAdresaManuale] = useState(false);
  const [orari, setOrari] = useState<IntervaliIOrarit[]>(orariIParazgjedhur);
  const [zgjedhurat, setZgjedhurat] = useState<Set<number>>(new Set([0, 1, 2, 3]));

  const gabimet = [
    { emri: emri.trim().length >= 2 ? null : t("wizard.gabimEmri") },
    {
      adresa: adresa.trim().length >= 3 ? null : t("wizard.gabimAdresa"),
      qyteti: qyteti.trim().length >= 2 ? null : t("wizard.gabimQyteti"),
    },
    { orari: orari.length > 0 && orariEshteIVlefshem(orari) ? null : t("wizard.gabimOrari") },
    {},
  ] as const;

  const hapiIVlefshem = Object.values(gabimet[hapi]).every((g) => g === null);

  function vazhdo() {
    setProvuar(true);
    if (!hapiIVlefshem) return;
    setProvuar(false);
    if (hapi < HAPAT - 1) {
      setHapi(hapi + 1);
      return;
    }
    krijo.mutate(
      {
        teDhenat: {
          emri: emri.trim(),
          pershkrimi: pershkrimi.trim() || null,
          telefoni: telefoni.trim() || null,
          adresa: adresa.trim(),
          qyteti: qyteti.trim(),
          vendndodhja,
        },
        orari,
        sherbimet: SHEMBUJT.filter((_, i) => zgjedhurat.has(i)).map((s) => ({
          emri: t(s.celesi),
          cmimi_centa: s.cmimi_centa,
          kohezgjatja_min: s.kohezgjatja_min,
        })),
      },
      { onSuccess: () => router.back() },
    );
  }

  function ndryshoSherbimin(i: number) {
    setZgjedhurat((meParshme) => {
      const teReja = new Set(meParshme);
      if (teReja.has(i)) teReja.delete(i);
      else teReja.add(i);
      return teReja;
    });
  }

  const titujt = [
    [t("wizard.infoTitulli"), t("wizard.infoTeksti")],
    [t("wizard.vendTitulli"), t("wizard.vendTeksti")],
    [t("wizard.orariTitulli"), t("wizard.orariTeksti")],
    [t("wizard.sherbimetTitulli"), t("wizard.sherbimetTeksti")],
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.progresi}>
        {Array.from({ length: HAPAT }, (_, i) => (
          <View key={i} style={[styles.progresiPjesa, i <= hapi && styles.progresiAktiv]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <Text style={styles.hapi}>{t("wizard.hapi", { hapi: hapi + 1, gjithsej: HAPAT })}</Text>
        <Text style={styles.titulli}>{titujt[hapi][0]}</Text>
        <Text style={styles.nentitulli}>{titujt[hapi][1]}</Text>

        {hapi === 0 && (
          <>
            <FushaTekstit
              etiketa={t("wizard.emri")}
              value={emri}
              onChangeText={setEmri}
              placeholder={t("wizard.emriShembull")}
              autoCapitalize="words"
              maxLength={80}
              gabimi={provuar ? gabimet[0].emri : null}
            />
            <FushaTekstit
              etiketa={t("wizard.pershkrimi")}
              value={pershkrimi}
              onChangeText={setPershkrimi}
              placeholder={t("wizard.pershkrimiShembull")}
              shumeRreshta
              maxLength={1000}
            />
            <FushaTekstit
              etiketa={t("wizard.telefoni")}
              ikona={ikonat.telefoni}
              value={telefoni}
              onChangeText={setTelefoni}
              placeholder="+383 4x xxx xxx"
              keyboardType="phone-pad"
              maxLength={30}
            />
          </>
        )}

        {hapi === 1 && (
          <>
            <ZgjedhesiVendndodhjes
              vlera={vendndodhja}
              onNdrysho={setVendndodhja}
              onAdresa={(a) => {
                if (adresaManuale) return;
                if (a.adresa) setAdresa(a.adresa);
                if (a.qyteti) setQyteti(a.qyteti);
              }}
            />
            <FushaTekstit
              etiketa={t("wizard.adresa")}
              value={adresa}
              onChangeText={(v) => {
                setAdresaManuale(true);
                setAdresa(v);
              }}
              placeholder={t("wizard.adresaShembull")}
              maxLength={200}
              gabimi={provuar ? gabimet[1].adresa : null}
            />
            <FushaTekstit
              etiketa={t("wizard.qyteti")}
              value={qyteti}
              onChangeText={(v) => {
                setAdresaManuale(true);
                setQyteti(v);
              }}
              placeholder={t("wizard.qytetiShembull")}
              autoCapitalize="words"
              maxLength={80}
              gabimi={provuar ? gabimet[1].qyteti : null}
            />
          </>
        )}

        {hapi === 2 && (
          <>
            <RedaktoriIOrarit oraret={orari} onNdrysho={setOrari} />
            {provuar && gabimet[2].orari ? <Text style={styles.gabimi}>{gabimet[2].orari}</Text> : null}
          </>
        )}

        {hapi === 3 && (
          <View style={styles.sherbimet}>
            {SHEMBUJT.map((s, i) => {
              const aktiv = zgjedhurat.has(i);
              return (
                <Pressable
                  key={s.celesi}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: aktiv }}
                  onPress={() => ndryshoSherbimin(i)}
                  style={({ pressed }) => [styles.sherbimi, aktiv && styles.sherbimiAktiv, pressed && styles.shtypur]}
                >
                  <View style={[styles.kutiza, aktiv && styles.kutizaAktive]}>
                    {aktiv && <Ikona emri={ikonat.konfirmo} madhesia={14} ngjyra={ngjyrat.mbiAri} />}
                  </View>
                  <View style={styles.sherbimiTeksti}>
                    <Text style={styles.sherbimiEmri}>{t(s.celesi)}</Text>
                    <Text style={styles.sherbimiKoha}>{formatoKohezgjatjen(s.kohezgjatja_min)}</Text>
                  </View>
                  <Text style={styles.sherbimiCmimi}>{formatoCmimin(s.cmimi_centa)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {krijo.isError && <GabimiIFormes mesazhi={t("pergjithshme.gabimPapritur")} />}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        {hapi > 0 && (
          <Butoni
            titulli={t("wizard.mbrapa")}
            varianti="dytesor"
            onPress={() => setHapi(hapi - 1)}
            style={styles.butoniMbrapa}
          />
        )}
        <Butoni
          titulli={t(hapi === HAPAT - 1 ? "wizard.perfundo" : "wizard.vazhdo")}
          ikona={hapi === HAPAT - 1 ? ikonat.konfirmo : undefined}
          ngarkohet={krijo.isPending}
          onPress={vazhdo}
          style={styles.butoniVazhdo}
        />
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
    progresi: {
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.sm,
    },
    progresiPjesa: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: ngjyrat.kufiri,
    },
    progresiAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    permbajtja: {
      padding: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    hapi: {
      color: ngjyrat.ari,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginTop: 6,
    },
    nentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 6,
      marginBottom: hapesira.xl,
    },
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      fontWeight: "600",
      marginTop: hapesira.sm,
    },
    sherbimet: {
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    sherbimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
    },
    sherbimiAktiv: {
      borderColor: ngjyrat.ari,
      backgroundColor: ngjyrat.ariIErret,
    },
    shtypur: {
      opacity: 0.85,
    },
    kutiza: {
      width: 24,
      height: 24,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: ngjyrat.tekstiZbehte,
      alignItems: "center",
      justifyContent: "center",
    },
    kutizaAktive: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    sherbimiTeksti: {
      flex: 1,
      gap: 2,
    },
    sherbimiEmri: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    sherbimiKoha: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    sherbimiCmimi: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    fundi: {
      flexDirection: "row",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.sfondi,
    },
    butoniMbrapa: {
      flex: 1,
    },
    butoniVazhdo: {
      flex: 2,
    },
  });
