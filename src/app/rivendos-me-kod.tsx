import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import { kerkoKodin, rivendosMeKod } from "../api/rivendosja";
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

// Fjalëkalimi i harruar te llogaria me telefon: (1) numri → kodi 6-shifror vjen te email-i i
// rikuperimit; (2) kodi + fjalëkalimi i ri → klienti hyn menjëherë.
export default function RivendosMeKod() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const [hapi, setHapi] = useState<"numri" | "kodi">("numri");
  const [prefiksi, setPrefiksi] = useState<Prefiksi>(PREFIKSET[0]);
  const [numri, setNumri] = useState("");
  const [kodi, setKodi] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [konfirmimi, setKonfirmimi] = useState("");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const telefoni = numriNderkombetar(prefiksi.prefiksi, numri);
  const gabimet = {
    telefoni: telefoni ? null : t("auth.gabimTelefoni"),
    kodi: /^\d{6}$/.test(kodi.trim()) ? null : t("rivendosja.gabimKodi"),
    fjalekalimi: fjalekalimi.length >= GJATESIA_MIN_FJALEKALIMIT ? null : t("auth.gabimFjalekalimi"),
    konfirmimi: konfirmimi === fjalekalimi ? null : t("rivendosja.nukPerputhen"),
  };

  async function dergoKodin() {
    setProvuar(true);
    setGabimi(null);
    if (!telefoni) return;
    setNgarkohet(true);
    try {
      await kerkoKodin(telefoni, gjuhaAktuale());
      setProvuar(false);
      setHapi("kodi");
    } catch {
      setGabimi(t("rivendosja.gabimDergimi"));
    } finally {
      setNgarkohet(false);
    }
  }

  async function ruaj() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.kodi || gabimet.fjalekalimi || gabimet.konfirmimi || !telefoni) return;
    setNgarkohet(true);
    try {
      const pergjigja = await rivendosMeKod(telefoni, kodi.trim(), fjalekalimi);
      if (pergjigja !== "ok") {
        setGabimi(pergjigja === "fjalekalimi_i_shkurter" ? t("auth.gabimFjalekalimi") : t("rivendosja.kodiNukVlen"));
        return;
      }
      // Hyn menjëherë me fjalëkalimin e ri; navigimi kalon vetë te Studio (shih _layout.tsx).
      const { error } = await supabase.auth.signInWithPassword({ email: emailNgaTelefoni(telefoni), password: fjalekalimi });
      if (error) setGabimi(mesazhiIGabimit(error, t));
    } catch {
      setGabimi(t("pergjithshme.gabimPapritur"));
    } finally {
      setNgarkohet(false);
    }
  }

  if (hapi === "numri") {
    return (
      <KornizaAuth titulli={t("rivendosja.titulli")} nentitulli={t("rivendosja.nentitulliNumri")}>
        <GabimiIFormes mesazhi={gabimi} />
        <FushaETelefonit
          prefiksi={prefiksi}
          onPrefiksi={setPrefiksi}
          numri={numri}
          onNumri={setNumri}
          gabimi={provuar ? gabimet.telefoni : null}
          onSubmitEditing={() => void dergoKodin()}
        />
        <Butoni titulli={t("rivendosja.dergoKodin")} ikona={ikonat.email} onPress={() => void dergoKodin()} ngarkohet={ngarkohet} />
        <Text style={styles.shenimi}>{t("rivendosja.paEmail")}</Text>
      </KornizaAuth>
    );
  }

  return (
    <KornizaAuth titulli={t("rivendosja.titulli")} nentitulli={t("rivendosja.nentitulliKodi")}>
      <GabimiIFormes mesazhi={gabimi} />
      <FushaTekstit
        etiketa={t("rivendosja.kodi")}
        ikona={ikonat.email}
        value={kodi}
        onChangeText={(v) => setKodi(v.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        gabimi={provuar ? gabimet.kodi : null}
      />
      <FushaTekstit
        etiketa={t("rivendosja.fjalekalimiIRi")}
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
        etiketa={t("rivendosja.konfirmo")}
        ikona={ikonat.dryni}
        value={konfirmimi}
        onChangeText={setKonfirmimi}
        placeholder="••••••••"
        fjalekalim
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void ruaj()}
        gabimi={provuar ? gabimet.konfirmimi : null}
      />
      <Butoni titulli={t("rivendosja.ruaj")} onPress={() => void ruaj()} ngarkohet={ngarkohet} />
      <Butoni
        titulli={t("rivendosja.dergoSerish")}
        varianti="dytesor"
        onPress={() => {
          setHapi("numri");
          setKodi("");
          setGabimi(null);
        }}
      />
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    shenimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 16,
      textAlign: "center",
    },
  });
