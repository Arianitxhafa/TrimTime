import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { useAuth } from "../context/AuthContext";
import { useStilet } from "../context/TemaContext";
import { mesazhiIGabimit } from "../lib/gabimetEAuth";
import { prekja } from "../lib/prekja";
import { supabase } from "../lib/supabase";
import { shkronjat, type Ngjyrat } from "../theme";

// Lidhja e rivendosjes vjen si ".../fjalekalimi-i-ri#access_token=…&refresh_token=…&type=recovery".
function lexoTokenat(url: string | null) {
  const fragmenti = url?.split("#")[1];
  if (!fragmenti) return null;
  const p = new URLSearchParams(fragmenti);
  const access = p.get("access_token");
  const refresh = p.get("refresh_token");
  return access && refresh ? { access_token: access, refresh_token: refresh } : null;
}

// Hapi i dytë: lidhja nga email-i hap këtë ekran (jashtë mbrojtjeve të navigimit), ku vendoset
// fjalëkalimi i ri.
export default function FjalekalimiIRi() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const url = Linking.useLinkingURL();
  const { sesioni } = useAuth();
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [perseritja, setPerseritja] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);
  const [lidhjaPavlefshme, setLidhjaPavlefshme] = useState(false);
  const [uNdryshua, setUNdryshua] = useState(false);

  useEffect(() => {
    const tokenat = lexoTokenat(url);
    if (!tokenat) return;
    supabase.auth.setSession(tokenat).then(({ error }) => {
      if (error) setLidhjaPavlefshme(true);
    });
  }, [url]);

  const gabimet = {
    fjalekalimi: fjalekalimi.length >= 8 ? null : t("auth.gabimFjalekalimi"),
    perseritja: perseritja === fjalekalimi ? null : t("auth.gabimNukPerputhen"),
  };

  async function ruaj() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.fjalekalimi || gabimet.perseritja) return;
    setNgarkohet(true);
    const { error } = await supabase.auth.updateUser({ password: fjalekalimi });
    setNgarkohet(false);
    if (error) {
      setGabimi(mesazhiIGabimit(error, t));
      return;
    }
    prekja.sukses();
    setUNdryshua(true);
  }

  if (uNdryshua) {
    return (
      <KornizaAuth titulli={t("auth.uNdryshua")} nentitulli={t("auth.uNdryshuaTeksti")}>
        <Butoni titulli={t("lejet.vazhdo")} onPress={() => router.replace("/")} />
      </KornizaAuth>
    );
  }

  // Pa sesion nga lidhja (p.sh. lidhje e vjetër ose e përdorur), nuk ka çfarë të ndryshohet.
  if (lidhjaPavlefshme || (!sesioni && !lexoTokenat(url))) {
    return (
      <KornizaAuth titulli={t("auth.lidhjaPavlefshme")} nentitulli={t("auth.lidhjaPavlefshmeTeksti")}>
        <Butoni titulli={t("auth.kthehuTeHyrja")} varianti="dytesor" onPress={() => router.replace("/")} />
      </KornizaAuth>
    );
  }

  return (
    <KornizaAuth titulli={t("auth.fjalekalimiIRi")} nentitulli={t("auth.fjalekalimiIRiTeksti")}>
      <GabimiIFormes mesazhi={gabimi} />
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
        gabimi={provuar ? gabimet.fjalekalimi : null}
      />
      <FushaTekstit
        etiketa={t("auth.perserit")}
        ikona={ikonat.dryni}
        value={perseritja}
        onChangeText={setPerseritja}
        placeholder="••••••••"
        fjalekalim
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={ruaj}
        gabimi={provuar ? gabimet.perseritja : null}
      />
      <Text style={styles.shenim}>{t("auth.gabimFjalekalimi")}</Text>
      <Butoni titulli={t("auth.ruajFjalekalimin")} onPress={ruaj} ngarkohet={ngarkohet} />
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    shenim: {
      fontFamily: shkronjat.etikete,
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      letterSpacing: 0.5,
      marginBottom: 16,
    },
  });
