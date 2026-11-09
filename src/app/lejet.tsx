import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import Marka from "../components/Marka";
import ZgjedhesiIQytetit from "../components/ZgjedhesiIQytetit";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet } from "../context/TemaContext";
import { gjendjaENjoftimeve, kerkoLejenENjoftimeve, type GjendjaELejes } from "../lib/kujtesat";
import { prekja } from "../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";

// "perafert": leja është dhënë, por vetëm për vendndodhjen e përafërt (iOS 14+ / Android 12+).
// "mohuar": përdoruesi tha jo, por mund të pyetet sërish; "refuzuar": vetëm nga Cilësimet.
type GjendjaEVendit = "pa_pyetur" | "lejuar" | "perafert" | "mohuar" | "refuzuar";

function lexoLejen(leja: Location.LocationPermissionResponse): GjendjaEVendit {
  if (!leja.granted) {
    if (!leja.canAskAgain) return "refuzuar";
    return leja.status === "denied" ? "mohuar" : "pa_pyetur";
  }
  if (leja.ios?.accuracy === "reduced" || leja.android?.accuracy === "coarse") return "perafert";
  return "lejuar";
}

// Gjendja aktuale e të dyja lejeve, pa pyetur përdoruesin.
async function lexoLejet(): Promise<{ leja: GjendjaEVendit; njoft: GjendjaELejes }> {
  const [leja, njoft] = await Promise.all([
    Location.getForegroundPermissionsAsync().then(lexoLejen).catch((): GjendjaEVendit => "pa_pyetur"),
    gjendjaENjoftimeve().catch((): GjendjaELejes => "pa_pyetur"),
  ]);
  return { leja, njoft };
}

// Ekrani i parë pas krijimit të llogarisë. Vendndodhja e saktë është e detyrueshme: pa të nuk ka
// lokale pranë, distanca as udhëzime. Kush e refuzon gjen shpjegimin, butonin për Cilësimet dhe,
// si rrugëdalje e fundit, zgjedhjen e qytetit me dorë (Apple nuk lejon bllokim të plotë).
export default function Lejet() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { perfundoLejet, qytetiIZgjedhur } = usePreferencat();
  const [vendndodhja, setVendndodhja] = useState<GjendjaEVendit>("pa_pyetur");
  const [njoftimet, setNjoftimet] = useState<GjendjaELejes>("pa_pyetur");
  const [zgjedhesi, setZgjedhesi] = useState(false);

  useEffect(() => {
    let aktiv = true;
    const perditeso = ({ leja, njoft }: { leja: GjendjaEVendit; njoft: GjendjaELejes }) => {
      if (!aktiv) return;
      setVendndodhja(leja);
      setNjoftimet(njoft);
    };
    // Kush i ka dhënë të dyja lejet më parë (p.sh. në versionin e kaluar), nuk e sheh më këtë ekran.
    lexoLejet().then((gjendja) => {
      perditeso(gjendja);
      if (aktiv && gjendja.leja === "lejuar" && gjendja.njoft !== "pa_pyetur") perfundoLejet();
    });
    // Kthimi nga Cilësimet e telefonit: leja mund të ketë ndryshuar.
    const abonimi = AppState.addEventListener("change", (gjendja) => {
      if (gjendja === "active") void lexoLejet().then(perditeso);
    });
    return () => {
      aktiv = false;
      abonimi.remove();
    };
  }, [perfundoLejet]);

  // Rrugëdalja: pasi zgjidhet një qytet me dorë, klienti vazhdon.
  useEffect(() => {
    if (qytetiIZgjedhur && vendndodhja !== "lejuar") perfundoLejet();
  }, [qytetiIZgjedhur, vendndodhja, perfundoLejet]);

  async function lejoVendndodhjen() {
    // iOS nuk e pyet më përdoruesin pas refuzimit ose lejes së përafërt: duhen Cilësimet.
    const teCilesimet =
      Platform.OS !== "web" && (vendndodhja === "refuzuar" || (vendndodhja === "perafert" && Platform.OS === "ios"));
    if (teCilesimet) {
      void Linking.openSettings();
      return;
    }
    const leja = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const gjendja = leja ? lexoLejen(leja) : "refuzuar";
    setVendndodhja(gjendja);
    if (gjendja === "lejuar") prekja.sukses();
    else prekja.gabim();
  }

  async function lejoNjoftimet() {
    if (njoftimet === "refuzuar" && Platform.OS !== "web") {
      void Linking.openSettings();
      return;
    }
    const gjendja = await kerkoLejenENjoftimeve().catch((): GjendjaELejes => "refuzuar");
    setNjoftimet(gjendja);
    if (gjendja === "lejuar") prekja.sukses();
  }

  const lejuar = vendndodhja === "lejuar";
  const shenimi =
    vendndodhja === "refuzuar"
      ? t("lejet.refuzuar")
      : vendndodhja === "mohuar"
        ? t("lejet.mohuar")
        : vendndodhja === "perafert"
        ? Platform.OS === "android"
          ? t("lejet.perafertAndroid")
          : t("lejet.perafert")
        : null;
  const tekstiIButonit =
    vendndodhja === "refuzuar" || (vendndodhja === "perafert" && Platform.OS === "ios")
      ? t("lejet.hapCilesimet")
      : t("lejet.lejoVendndodhjen");

  return (
    <View style={styles.container}>
      <ZgjedhesiIQytetit
        iDukshem={zgjedhesi}
        qytetiAktual={null}
        onMbyll={() => setZgjedhesi(false)}
        onVendndodhjaIme={() => void lejoVendndodhjen()}
      />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingTop: insets.top + hapesira.lg }]}>
        <Marka madhesia={30} />
        <View style={styles.vijaETrashe} />
        <View style={styles.rreshtiMono}>
          <Text style={styles.mono}>{t("lejet.etiketa")}</Text>
        </View>
        <View style={styles.vijaEHolle} />

        <Text style={styles.titulli}>{t("lejet.titulli")}</Text>
        <Text style={styles.nentitulli}>{t("lejet.nentitulli")}</Text>

        <View style={styles.seksioni}>
          <View style={styles.rreshtiMono}>
            <Text style={styles.numri}>01</Text>
            <Text style={[styles.vula, styles.vulaKuqe]}>{t("lejet.detyrueshme")}</Text>
          </View>
          <Text style={styles.seksioniTitulli}>{t("lejet.vendndodhja")}</Text>
          <Text style={styles.seksioniTeksti}>{t("lejet.vendndodhjaTeksti")}</Text>
          {shenimi ? (
            <Text style={styles.shenimi} accessibilityLiveRegion="polite">
              {shenimi}
            </Text>
          ) : null}
          {lejuar ? (
            <Text style={styles.lejuar}>✓ {t("lejet.lejuarSakte")}</Text>
          ) : (
            <Butoni titulli={tekstiIButonit} onPress={() => void lejoVendndodhjen()} />
          )}
        </View>

        <View style={styles.seksioni}>
          <View style={styles.rreshtiMono}>
            <Text style={styles.numri}>02</Text>
            <Text style={styles.vula}>{t("lejet.opsionale")}</Text>
          </View>
          <Text style={styles.seksioniTitulli}>{t("lejet.njoftimet")}</Text>
          <Text style={styles.seksioniTeksti}>{t("lejet.njoftimetTeksti")}</Text>
          {njoftimet === "lejuar" ? (
            <Text style={styles.lejuar}>✓ {t("lejet.lejuar")}</Text>
          ) : (
            <Butoni
              titulli={njoftimet === "refuzuar" ? t("lejet.hapCilesimet") : t("lejet.lejo")}
              varianti="dytesor"
              onPress={() => void lejoNjoftimet()}
            />
          )}
        </View>

        <Text style={styles.privatesia}>{t("lejet.privatesia")}</Text>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}>
        <Butoni
          titulli={t("lejet.vazhdo")}
          joAktiv={!lejuar}
          onPress={perfundoLejet}
        />
        {!lejuar && vendndodhja !== "pa_pyetur" && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setZgjedhesi(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.meDore, pressed && styles.shtypur]}
          >
            <Text style={styles.meDoreTeksti}>{t("lejet.zgjidhMeDore")}</Text>
          </Pressable>
        )}
      </View>
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
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    vijaETrashe: {
      height: 4,
      backgroundColor: ngjyrat.vija,
      marginTop: hapesira.sm,
    },
    vijaEHolle: {
      height: 1,
      backgroundColor: ngjyrat.vija,
    },
    rreshtiMono: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 6,
    },
    mono: {
      fontFamily: shkronjat.mono,
      color: ngjyrat.teksti,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    titulli: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 46,
      lineHeight: 50,
      letterSpacing: -1.4,
      marginTop: hapesira.xl,
    },
    nentitulli: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 17,
      lineHeight: 24,
      marginTop: hapesira.md,
      marginBottom: hapesira.lg,
    },
    seksioni: {
      borderTopWidth: 1.5,
      borderTopColor: ngjyrat.vija,
      paddingTop: hapesira.sm,
      marginTop: hapesira.lg,
      gap: hapesira.sm,
    },
    numri: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.theksi,
      fontSize: 13,
      letterSpacing: 1,
    },
    vula: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      borderWidth: 1,
      borderColor: ngjyrat.tekstiDyte,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    vulaKuqe: {
      color: ngjyrat.theksi,
      borderColor: ngjyrat.theksi,
    },
    seksioniTitulli: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 28,
      letterSpacing: -0.6,
    },
    seksioniTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: hapesira.sm,
    },
    shenimi: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 15,
      lineHeight: 21,
      borderLeftWidth: 3,
      borderLeftColor: ngjyrat.theksi,
      paddingLeft: hapesira.md,
      marginBottom: hapesira.sm,
    },
    lejuar: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      paddingVertical: hapesira.sm,
    },
    privatesia: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.tekstiZbehte,
      fontSize: 14,
      lineHeight: 20,
      marginTop: hapesira.xl,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.vija,
      gap: hapesira.md,
    },
    meDore: {
      alignSelf: "center",
      paddingVertical: 4,
    },
    shtypur: {
      opacity: 0.6,
    },
    meDoreTeksti: {
      fontFamily: shkronjat.mono,
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      textDecorationLine: "underline",
      textAlign: "center",
    },
  });
