import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import { ikonat } from "../../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet } from "../../context/TemaContext";
import { emailIVlefshem, mesazhiIGabimit } from "../../lib/gabimetEAuth";
import { supabase } from "../../lib/supabase";
import { type Ngjyrat } from "../../theme";

export default function Hyrja() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const gabimet = {
    email: emailIVlefshem(email) ? null : t("auth.gabimEmail"),
    fjalekalimi: fjalekalimi.length > 0 ? null : t("auth.gabimFjalekalimiBosh"),
  };

  async function hyr() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.email || gabimet.fjalekalimi) return;

    setNgarkohet(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: fjalekalimi,
    });
    setNgarkohet(false);
    // Pas hyrjes së suksesshme, navigimi kalon vetë te tab-et (shih _layout.tsx).
    if (error) setGabimi(mesazhiIGabimit(error, t));
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
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={hyr}
        gabimi={provuar ? gabimet.fjalekalimi : null}
      />
      <Butoni titulli={t("auth.hyr")} onPress={hyr} ngarkohet={ngarkohet} style={styles.butoni} />
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
  });
