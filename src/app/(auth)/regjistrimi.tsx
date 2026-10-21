import { Link, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { gjuhaAktuale } from "../../i18n";
import { emailIVlefshem, mesazhiIGabimit } from "../../lib/gabimetEAuth";
import { supabase } from "../../lib/supabase";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const GJATESIA_MIN_FJALEKALIMIT = 8;

export default function Regjistrimi() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const [emri, setEmri] = useState("");
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);
  const [priteKonfirmimin, setPriteKonfirmimin] = useState(false);

  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("auth.gabimEmri"),
    email: emailIVlefshem(email) ? null : t("auth.gabimEmail"),
    fjalekalimi:
      fjalekalimi.length >= GJATESIA_MIN_FJALEKALIMIT ? null : t("auth.gabimFjalekalimi"),
  };

  async function regjistrohu() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.emri || gabimet.email || gabimet.fjalekalimi) return;

    setNgarkohet(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: fjalekalimi,
      // Trigger-i krijo_profilin_e_ri në databazë e merr emrin nga këtu.
      options: { data: { emri: emri.trim(), gjuha: gjuhaAktuale() } },
    });
    setNgarkohet(false);

    if (error) {
      setGabimi(mesazhiIGabimit(error, t));
      return;
    }
    // Kur email-i ekziston, Supabase nuk kthen gabim (për të mos zbuluar llogaritë),
    // por përdoruesi i kthyer nuk ka asnjë identitet.
    if (data.user && data.user.identities?.length === 0) {
      setGabimi(t("auth.gabimEkziston"));
      return;
    }
    // Pa sesion do të thotë që projekti kërkon konfirmimin e email-it.
    if (!data.session) setPriteKonfirmimin(true);
  }

  if (priteKonfirmimin) {
    return (
      <KornizaAuth
        titulli={t("auth.kontrolloEmailinTitulli")}
        nentitulli={t("auth.kontrolloEmailinTeksti", { email: email.trim() })}
      >
        <View style={styles.ikonaEmailit}>
          <Ikona emri={ikonat.email} madhesia={36} ngjyra={ngjyrat.ari} />
        </View>
        <Butoni
          titulli={t("auth.kthehuTeHyrja")}
          varianti="dytesor"
          onPress={() => router.replace("/hyrja")}
        />
      </KornizaAuth>
    );
  }

  return (
    <KornizaAuth
      titulli={t("auth.regjistrimiTitulli")}
      nentitulli={t("auth.regjistrimiNentitulli")}
      fundi={
        <>
          <Text style={styles.tekstiFundit}>{t("auth.keLlogari")}</Text>
          <Link href="/hyrja" replace style={styles.lidhja}>
            {t("auth.hyr")}
          </Link>
        </>
      }
    >
      <GabimiIFormes mesazhi={gabimi} />
      <FushaTekstit
        etiketa={t("auth.emri")}
        ikona={ikonat.personi}
        value={emri}
        onChangeText={setEmri}
        placeholder="Arben Krasniqi"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        gabimi={provuar ? gabimet.emri : null}
      />
      <FushaTekstit
        etiketa={t("auth.email")}
        ikona={ikonat.email}
        value={email}
        onChangeText={setEmail}
        placeholder="emri@shembull.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        gabimi={provuar ? gabimet.email : null}
      />
      <FushaTekstit
        etiketa={t("auth.fjalekalimi")}
        ikona={ikonat.dryni}
        value={fjalekalimi}
        onChangeText={setFjalekalimi}
        placeholder="••••••••"
        fjalekalim
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={regjistrohu}
        gabimi={provuar ? gabimet.fjalekalimi : null}
      />
      <Butoni titulli={t("auth.krijo")} onPress={regjistrohu} ngarkohet={ngarkohet} style={styles.butoni} />
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    butoni: {
      marginTop: 8,
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
    ikonaEmailit: {
      width: 88,
      height: 88,
      borderRadius: rrezja.lg,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.xl,
    },
  });
