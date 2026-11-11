import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Butoni from "../components/Butoni";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet } from "../context/TemaContext";
import { mesazhiIGabimit } from "../lib/gabimetEAuth";
import { prekja } from "../lib/prekja";
import { supabase } from "../lib/supabase";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

const GJATESIA_E_KODIT = 6;
// Supabase lejon një email të ri vetëm pas 60 sekondash për të njëjtën adresë.
const PRITJA_S = 60;

// Verifikimi i email-it me kodin 6-shifror që Supabase e dërgon pas regjistrimit. Shfaqet vetëm kur
// projekti e ka të ndezur "Confirm email"; përndryshe regjistrimi kthen sesion dhe ky ekran s'hapet.
export default function Verifiko() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const { modi } = usePreferencat();
  // dergo=1: vjen nga hyrja me llogari të pakonfirmuar, ndaj kodi i vjetër ka skaduar.
  const { email = "", dergo } = useLocalSearchParams<{ email?: string; dergo?: string }>();
  const fusha = useRef<ComponentRef<typeof TextInput>>(null);
  const [kodi, setKodi] = useState("");
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);
  const [uRidergua, setURidergua] = useState(false);
  const [pritja, setPritja] = useState(PRITJA_S);

  // Numërimi mbrapsht deri te "Dërgo kod të ri".
  useEffect(() => {
    if (pritja <= 0) return;
    const kohematesi = setTimeout(() => setPritja((p) => p - 1), 1000);
    return () => clearTimeout(kohematesi);
  }, [pritja]);

  async function ridergo() {
    setGabimi(null);
    setURidergua(false);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setGabimi(mesazhiIGabimit(error, t));
      return;
    }
    setURidergua(true);
    setPritja(PRITJA_S);
  }

  // Nga hyrja: kodi i ri dërgohet sapo hapet ekrani.
  const uDerguaNeFillim = useRef(false);
  useEffect(() => {
    if (dergo !== "1" || uDerguaNeFillim.current || !email) return;
    uDerguaNeFillim.current = true;
    void supabase.auth.resend({ type: "signup", email }).then(({ error }) => {
      if (!error) return;
      setGabimi(mesazhiIGabimit(error, t));
      setPritja(0);
    });
  }, [dergo, email, t]);

  async function verifiko(kodiIPlote: string) {
    if (kodiIPlote.length !== GJATESIA_E_KODIT || ngarkohet) return;
    setGabimi(null);
    setNgarkohet(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: kodiIPlote, type: "email" });
    if (error) {
      setNgarkohet(false);
      prekja.gabim();
      setKodi("");
      setGabimi(
        error.code === "otp_expired" || error.code === "invalid_credentials"
          ? t("auth.gabimKodi")
          : mesazhiIGabimit(error, t),
      );
      fusha.current?.focus();
      return;
    }
    prekja.sukses();
    // Llogaritë pa rol e marrin rolin e zgjedhur në këtë telefon (si te hyrja).
    if (data.user && !data.user.user_metadata?.roli) {
      await supabase.auth.updateUser({ data: { roli: modi } });
    }
    // Sesioni u krijua: navigimi kalon vetë te lejet (shih _layout.tsx).
  }

  function ndryshoKodin(teksti: string) {
    const shifrat = teksti.replace(/\D/g, "").slice(0, GJATESIA_E_KODIT);
    setKodi(shifrat);
    if (shifrat.length === GJATESIA_E_KODIT) void verifiko(shifrat);
  }

  return (
    <KornizaAuth
      titulli={t("auth.verifikoTitulli")}
      nentitulli={t("auth.verifikoTeksti", { email })}
      fundi={
        <>
          <Text style={styles.tekstiFundit}>{t("auth.emailIGabuar")}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/regjistrimi")} hitSlop={8}>
            <Text style={styles.lidhja}>{t("auth.ndryshoEmailin")}</Text>
          </Pressable>
        </>
      }
    >
      <GabimiIFormes mesazhi={gabimi} />

      {/* Një fushë e vetme e padukshme mban kodin: kështu iOS e ofron vetë kodin nga email-i
          dhe ngjitja e 6 shifrave punon me një prekje. Kutitë vetëm e vizatojnë. */}
      <Pressable
        accessibilityRole="none"
        onPress={() => fusha.current?.focus()}
        style={styles.kutite}
      >
        {Array.from({ length: GJATESIA_E_KODIT }, (_, i) => {
          const shifra = kodi[i];
          const aktive = i === kodi.length && !ngarkohet;
          return (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 45).duration(320)}
              style={[styles.kutia, aktive && styles.kutiaAktive, shifra ? styles.kutiaEPlote : null]}
            >
              <Text style={styles.shifra}>{shifra ?? ""}</Text>
            </Animated.View>
          );
        })}
        <TextInput
          ref={fusha}
          value={kodi}
          onChangeText={ndryshoKodin}
          accessibilityLabel={t("auth.kodi")}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={GJATESIA_E_KODIT}
          autoFocus
          caretHidden
          editable={!ngarkohet}
          style={styles.fushaEFshehur}
        />
      </Pressable>

      <Butoni
        titulli={t("auth.verifiko")}
        onPress={() => void verifiko(kodi)}
        joAktiv={kodi.length !== GJATESIA_E_KODIT}
        ngarkohet={ngarkohet}
        style={styles.butoni}
      />

      <View style={styles.ridergo} accessibilityLiveRegion="polite">
        {pritja > 0 ? (
          <Text style={styles.ridergoPritja}>
            {uRidergua ? `${t("auth.kodiURidergua")} ` : ""}
            {t("auth.ridergoPas", { sekonda: pritja })}
          </Text>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => void ridergo()} hitSlop={10}>
            <Text style={styles.lidhja}>{t("auth.ridergoKodin")}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.shenimi}>{t("auth.verifikoShenimi")}</Text>
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    kutite: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: hapesira.sm,
      marginBottom: hapesira.xl,
    },
    kutia: {
      flex: 1,
      aspectRatio: 0.82,
      maxHeight: 64,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    kutiaAktive: {
      borderColor: ngjyrat.ari,
    },
    kutiaEPlote: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    shifra: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      fontVariant: ["tabular-nums"],
    },
    // E padukshme, por e fokusueshme: mbulon kutitë që prekja ta hapë tastierën.
    fushaEFshehur: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 0.01,
      color: "transparent",
    },
    butoni: {
      marginTop: 4,
    },
    ridergo: {
      alignItems: "center",
      marginTop: hapesira.xl,
      minHeight: 22,
    },
    ridergoPritja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
    },
    shenimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      marginTop: hapesira.lg,
    },
    tekstiFundit: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    lidhja: {
      color: ngjyrat.ari,
      fontSize: 15,
      fontWeight: "700",
    },
  });
