import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Butoni from "../components/Butoni";
import FushaETelefonit from "../components/FushaETelefonit";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { useStilet } from "../context/TemaContext";
import { gjuhaAktuale } from "../i18n";
import { mesazhiIGabimit } from "../lib/gabimetEAuth";
import { supabase } from "../lib/supabase";
import { emailNgaTelefoni, numriNderkombetar, PREFIKSET, type Prefiksi } from "../lib/telefoni";
import { type Ngjyrat } from "../theme";

const GJATESIA_MIN_FJALEKALIMIT = 8;

// Regjistrimi me emër, telefon dhe fjalëkalim (dy herë). Llogaria e re pret aprovimin e Studios:
// pas regjistrimit hapet vetë ekrani "Llogaria juaj po kontrollohet" (shih _layout.tsx).
export default function Regjistrimi() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const [emri, setEmri] = useState("");
  const [prefiksi, setPrefiksi] = useState<Prefiksi>(PREFIKSET[0]);
  const [numri, setNumri] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [perseritja, setPerseritja] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const telefoni = numriNderkombetar(prefiksi.prefiksi, numri);
  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("auth.gabimEmri"),
    telefoni: telefoni ? null : t("auth.gabimTelefoni"),
    fjalekalimi: fjalekalimi.length >= GJATESIA_MIN_FJALEKALIMIT ? null : t("auth.gabimFjalekalimi"),
    perseritja: perseritja === fjalekalimi ? null : t("auth.gabimNukPerputhen"),
  };

  async function regjistrohu() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.emri || gabimet.telefoni || gabimet.fjalekalimi || gabimet.perseritja) return;

    setNgarkohet(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailNgaTelefoni(telefoni!),
      password: fjalekalimi,
      // Trigger-i krijo_profilin_e_ri e merr emrin dhe telefonin nga këtu. Çdo llogari e re është
      // klient në pritje të aprovimit; stafi bashkohet më pas me kodin e ftesës.
      options: { data: { emri: emri.trim(), telefoni: telefoni!, gjuha: gjuhaAktuale() } },
    });
    setNgarkohet(false);

    if (error) {
      setGabimi(
        error.code === "user_already_exists" || error.code === "email_exists"
          ? t("auth.gabimTelefoniEkziston")
          : mesazhiIGabimit(error, t),
      );
      return;
    }
    // Numri ekziston: Supabase nuk kthen gabim, por përdoruesi i kthyer s'ka asnjë identitet.
    if (data.user && data.user.identities?.length === 0) {
      setGabimi(t("auth.gabimTelefoniEkziston"));
      return;
    }
    // Pa sesion: "Confirm email" është i ndezur në Supabase, që me telefon s'mund të punojë.
    if (!data.session) setGabimi(t("auth.gabimKonfirmimi"));
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
      <FushaETelefonit
        prefiksi={prefiksi}
        onPrefiksi={setPrefiksi}
        numri={numri}
        onNumri={setNumri}
        gabimi={provuar ? gabimet.telefoni : null}
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
        returnKeyType="next"
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
        returnKeyType="go"
        onSubmitEditing={regjistrohu}
        gabimi={provuar ? gabimet.perseritja : null}
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
  });
