import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import Marka from "../components/Marka";
import Xham from "../components/Xham";
import ZgjedhesiIQytetit from "../components/ZgjedhesiIQytetit";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { gjendjaENjoftimeve, kerkoLejenENjoftimeve, type GjendjaELejes } from "../lib/kujtesat";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

// "perafert": leja është dhënë, por vetëm për vendndodhjen e përafërt (iOS 14+ / Android 12+).
// "mohuar": përdoruesi tha jo, por mund të pyetet sërish; "refuzuar": vetëm nga Cilësimet.
type GjendjaEVendit = "pa_pyetur" | "lejuar" | "perafert" | "mohuar" | "refuzuar";
type Hapi = "njoftimet" | "vendndodhja";

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

// Pas krijimit të llogarisë, si te aplikacionet e Apple: një ekran për çdo leje, me dritaren e
// sistemit pas butonit. Së pari njoftimet (opsionale), pastaj vendndodhja e saktë. Kjo e fundit është
// e detyrueshme: pa të nuk ka lokale pranë, distanca as udhëzime. Kush e refuzon gjen shpjegimin,
// butonin për Cilësimet dhe, si rrugëdalje, zgjedhjen e qytetit me dorë (Apple nuk lejon bllokim).
export default function Lejet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { perfundoLejet, qytetiIZgjedhur } = usePreferencat();
  const [hapi, setHapi] = useState<Hapi>("njoftimet");
  const [vendndodhja, setVendndodhja] = useState<GjendjaEVendit>("pa_pyetur");
  const [gati, setGati] = useState(false);
  const [nePritje, setNePritje] = useState(false);
  const [zgjedhesi, setZgjedhesi] = useState(false);

  useEffect(() => {
    let aktiv = true;
    lexoLejet().then(({ leja, njoft }) => {
      if (!aktiv) return;
      setVendndodhja(leja);
      // Kush i ka vendosur të dyja më parë (p.sh. në versionin e kaluar), nuk e sheh më këtë ekran.
      if (leja === "lejuar" && njoft !== "pa_pyetur") {
        perfundoLejet();
        return;
      }
      // Njoftimet pyeten vetëm një herë: kur janë vendosur, fillohet nga vendndodhja.
      if (njoft !== "pa_pyetur") setHapi("vendndodhja");
      setGati(true);
    });
    // Kthimi nga Cilësimet e telefonit: leja mund të ketë ndryshuar.
    const abonimi = AppState.addEventListener("change", (gjendja) => {
      if (gjendja !== "active") return;
      void lexoLejet().then(({ leja }) => {
        if (aktiv) setVendndodhja(leja);
      });
    });
    return () => {
      aktiv = false;
      abonimi.remove();
    };
  }, [perfundoLejet]);

  // Vendndodhja e saktë u lejua (këtu ose te Cilësimet): klienti vazhdon vetë, pa një prekje tjetër.
  useEffect(() => {
    if (!gati || hapi !== "vendndodhja" || vendndodhja !== "lejuar") return;
    const kohematesi = setTimeout(perfundoLejet, 650);
    return () => clearTimeout(kohematesi);
  }, [gati, hapi, vendndodhja, perfundoLejet]);

  // Rrugëdalja: pasi zgjidhet një qytet me dorë, klienti vazhdon.
  useEffect(() => {
    if (qytetiIZgjedhur && vendndodhja !== "lejuar") perfundoLejet();
  }, [qytetiIZgjedhur, vendndodhja, perfundoLejet]);

  async function lejoNjoftimet() {
    setNePritje(true);
    const gjendja = await kerkoLejenENjoftimeve().catch((): GjendjaELejes => "refuzuar");
    setNePritje(false);
    if (gjendja === "lejuar") prekja.sukses();
    setHapi("vendndodhja");
  }

  async function lejoVendndodhjen() {
    // iOS nuk e pyet më përdoruesin pas refuzimit ose lejes së përafërt: duhen Cilësimet.
    const teCilesimet =
      Platform.OS !== "web" && (vendndodhja === "refuzuar" || (vendndodhja === "perafert" && Platform.OS === "ios"));
    if (teCilesimet) {
      void Linking.openSettings();
      return;
    }
    setNePritje(true);
    const leja = await Location.requestForegroundPermissionsAsync().catch(() => null);
    setNePritje(false);
    const gjendja = leja ? lexoLejen(leja) : "refuzuar";
    setVendndodhja(gjendja);
    if (gjendja === "lejuar") prekja.sukses();
    else prekja.gabim();
  }

  // Derisa të lexohen lejet, ekrani mbetet bosh (një çast), që hapi i gabuar të mos shfaqet kot.
  if (!gati) return <View style={styles.container} />;

  const teNjoftimet = hapi === "njoftimet";
  const lejuar = vendndodhja === "lejuar";
  const ngjyraEHapit = teNjoftimet ? ngjyrat.blu : ngjyrat.jeshile;
  const shenimi = teNjoftimet
    ? null
    : vendndodhja === "refuzuar"
      ? t("lejet.refuzuar")
      : vendndodhja === "mohuar"
        ? t("lejet.mohuar")
        : vendndodhja === "perafert"
          ? Platform.OS === "android"
            ? t("lejet.perafertAndroid")
            : t("lejet.perafert")
          : null;
  const teCilesimet = vendndodhja === "refuzuar" || (vendndodhja === "perafert" && Platform.OS === "ios");

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg }]}>
      <ZgjedhesiIQytetit
        iDukshem={zgjedhesi}
        qytetiAktual={null}
        onMbyll={() => setZgjedhesi(false)}
        onVendndodhjaIme={() => void lejoVendndodhjen()}
      />

      <View style={styles.koka}>
        <Marka madhesia={24} />
        <View style={styles.pikat} accessibilityLabel={t("lejet.hapi", { numri: teNjoftimet ? 1 : 2 })}>
          <View style={[styles.pika, teNjoftimet && { backgroundColor: ngjyraEHapit, width: 22 }]} />
          <View style={[styles.pika, !teNjoftimet && { backgroundColor: ngjyraEHapit, width: 22 }]} />
        </View>
      </View>

      {/* `key` e rinis animacionin kur ndërron hapi. */}
      <View key={hapi} style={styles.qendra}>
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <Xham style={styles.disku} ngjyrimi={ngjyraEHapit}>
            <Ikona
              emri={teNjoftimet ? ikonat.zile : lejuar ? ikonat.konfirmo : ikonat.vendi}
              madhesia={46}
              ngjyra="#FFFFFF"
            />
          </Xham>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(90).duration(380)} style={styles.titulli}>
          {teNjoftimet ? t("lejet.njoftimetTitulli") : lejuar ? t("lejet.gatiTitulli") : t("lejet.titulli")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(160).duration(380)} style={styles.teksti}>
          {teNjoftimet ? t("lejet.njoftimetTeksti") : lejuar ? t("lejet.lejuarSakte") : t("lejet.vendndodhjaTeksti")}
        </Animated.Text>

        {shenimi ? (
          <Animated.View entering={FadeIn.duration(250)} style={styles.shenimi}>
            <Ikona emri={ikonat.gabim} madhesia={16} ngjyra={ngjyrat.theksi} />
            <Text style={styles.shenimiTeksti} accessibilityLiveRegion="polite">
              {shenimi}
            </Text>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View
        entering={FadeInDown.delay(220).duration(380)}
        style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}
      >
        <Text style={styles.privatesia}>{teNjoftimet ? t("lejet.njoftimetShenimi") : t("lejet.privatesia")}</Text>

        {teNjoftimet ? (
          <>
            <Butoni
              titulli={t("lejet.lejoNjoftimet")}
              ikona={ikonat.zile}
              ngarkohet={nePritje}
              onPress={() => void lejoNjoftimet()}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setHapi("vendndodhja")}
              hitSlop={8}
              style={({ pressed }) => [styles.dytesor, pressed && styles.shtypur]}
            >
              <Text style={styles.dytesorTeksti}>{t("lejet.joTani")}</Text>
            </Pressable>
          </>
        ) : lejuar ? null : (
          <>
            <Butoni
              titulli={teCilesimet ? t("lejet.hapCilesimet") : t("lejet.lejoVendndodhjen")}
              ikona={teCilesimet ? ikonat.cilesimet : ikonat.vendi}
              ngarkohet={nePritje}
              onPress={() => void lejoVendndodhjen()}
            />
            {vendndodhja !== "pa_pyetur" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setZgjedhesi(true)}
                hitSlop={8}
                style={({ pressed }) => [styles.dytesor, pressed && styles.shtypur]}
              >
                <Text style={styles.dytesorTeksti}>{t("lejet.zgjidhMeDore")}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </Animated.View>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
      paddingHorizontal: hapesira.xl,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pikat: {
      flexDirection: "row",
      gap: 6,
    },
    pika: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: ngjyrat.siperfaqja2,
    },
    qendra: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.md,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    disku: {
      width: 124,
      height: 124,
      borderRadius: 62,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.lg,
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 34,
      lineHeight: 40,
      letterSpacing: -0.6,
      textAlign: "center",
    },
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 17,
      lineHeight: 24,
      textAlign: "center",
    },
    shenimi: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      padding: hapesira.md,
      marginTop: hapesira.sm,
    },
    shenimiTeksti: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 14,
      lineHeight: 20,
    },
    fundi: {
      gap: hapesira.md,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    privatesia: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
    dytesor: {
      alignSelf: "center",
      paddingVertical: 6,
    },
    shtypur: {
      opacity: 0.6,
    },
    dytesorTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
    },
  });
