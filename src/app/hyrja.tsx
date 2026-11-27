import { Link, router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Butoni from "../components/Butoni";
import FushaETelefonit from "../components/FushaETelefonit";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { useStilet } from "../context/TemaContext";
import { emailIVlefshem, mesazhiIGabimit } from "../lib/gabimetEAuth";
import { supabase } from "../lib/supabase";
import { emailNgaTelefoni, numriNderkombetar, PREFIKSET, type Prefiksi } from "../lib/telefoni";
import { type Ngjyrat } from "../theme";

// Hyrja: klientët me telefon + fjalëkalim. Stafi dhe llogaritë e vjetra (të krijuara me email)
// kalojnë te "Hyr me email".
export default function Hyrja() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const [meEmail, setMeEmail] = useState(false);
  const [prefiksi, setPrefiksi] = useState<Prefiksi>(PREFIKSET[0]);
  const [numri, setNumri] = useState("");
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const telefoni = numriNderkombetar(prefiksi.prefiksi, numri);
  const gabimet = {
    identiteti: meEmail
      ? emailIVlefshem(email)
        ? null
        : t("auth.gabimEmail")
      : telefoni
        ? null
        : t("auth.gabimTelefoni"),
    fjalekalimi: fjalekalimi.length > 0 ? null : t("auth.gabimFjalekalimiBosh"),
  };

  async function hyr() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.identiteti || gabimet.fjalekalimi) return;

    setNgarkohet(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: meEmail ? email.trim() : emailNgaTelefoni(telefoni!),
      password: fjalekalimi,
    });
    setNgarkohet(false);
    if (error) {
      // Llogari me email e krijuar por e pakonfirmuar: dërgohet kod i ri dhe hapet verifikimi.
      if (meEmail && error.code === "email_not_confirmed") {
        router.push({ pathname: "/verifiko", params: { email: email.trim(), dergo: "1" } });
        return;
      }
      setGabimi(error.code === "invalid_credentials" && !meEmail ? t("auth.gabimTelefoniFjalekalimi") : mesazhiIGabimit(error, t));
    }
    // Pas hyrjes, navigimi kalon vetë te Studio, ose te "Llogaria po kontrollohet" (shih _layout.tsx).
  }

  return (
    <KornizaAuth
      titulli={t("auth.hyrjaTitulli")}
      nentitulli={t("auth.hyrjaNentitulli")}
      fundi={
        <>
          <Text style={styles.tekstiFundit}>{t("auth.skeLlogari")}</Text>
          <Link href="/regjistrimi" replace style={styles.lidhja}>
            {t("auth.regjistrohu")}
          </Link>
        </>
      }
    >
      <GabimiIFormes mesazhi={gabimi} />
      {meEmail ? (
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
          gabimi={provuar ? gabimet.identiteti : null}
        />
      ) : (
        <FushaETelefonit
          prefiksi={prefiksi}
          onPrefiksi={setPrefiksi}
          numri={numri}
          onNumri={setNumri}
          gabimi={provuar ? gabimet.identiteti : null}
        />
      )}
      <FushaTekstit
        etiketa={t("auth.fjalekalimi")}
        ikona={ikonat.dryni}
        value={fjalekalimi}
        onChangeText={setFjalekalimi}
        placeholder="••••••••"
        fjalekalim
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={hyr}
        gabimi={provuar ? gabimet.fjalekalimi : null}
      />
      {meEmail ? (
        <Link href={{ pathname: "/rivendos", params: { email: email.trim() } }} style={styles.harrove}>
          {t("auth.harrove")}
        </Link>
      ) : (
        <View style={styles.harroveTelefoni}>
          <Text style={styles.harroveTeksti}>{t("auth.harroveTelefoni")}</Text>
          <Link href="/rivendos-me-kod" style={[styles.harrove, styles.paHapesire]}>
            {t("auth.kamKod")}
          </Link>
        </View>
      )}
      <Butoni titulli={t("auth.hyr")} onPress={hyr} ngarkohet={ngarkohet} style={styles.butoni} />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setMeEmail((v) => !v);
          setProvuar(false);
          setGabimi(null);
        }}
        hitSlop={8}
        style={styles.ndryshoMenyren}
      >
        <Text style={styles.ndryshoMenyrenTeksti}>{meEmail ? t("auth.hyrMeTelefon") : t("auth.hyrMeEmail")}</Text>
      </Pressable>
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    butoni: {
      marginTop: 8,
    },
    harrove: {
      alignSelf: "flex-end",
      color: ngjyrat.teksti,
      fontSize: 14,
      textDecorationLine: "underline",
      marginTop: -6,
      marginBottom: 16,
    },
    paHapesire: {
      marginTop: 0,
      marginBottom: 0,
    },
    harroveTelefoni: {
      marginTop: -6,
      marginBottom: 16,
      gap: 6,
    },
    harroveTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
    },
    ndryshoMenyren: {
      alignSelf: "center",
      paddingVertical: 14,
    },
    ndryshoMenyrenTeksti: {
      color: ngjyrat.ari,
      fontSize: 15,
      fontWeight: "700",
      textDecorationLine: "underline",
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
