import { useState } from "react";
import { useTranslation } from "react-i18next";
import Butoni from "../components/Butoni";
import FushaETelefonit from "../components/FushaETelefonit";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { rivendosMeKod } from "../api/rivendosja";
import { mesazhiIGabimit } from "../lib/gabimetEAuth";
import { supabase } from "../lib/supabase";
import { emailNgaTelefoni, numriNderkombetar, PREFIKSET, type Prefiksi } from "../lib/telefoni";

const GJATESIA_MIN_FJALEKALIMIT = 8;

// Fjalëkalim i ri për llogarinë me telefon: klienti merr një kod 6-shifror nga Studio, pastaj
// zgjedh fjalëkalimin e ri dhe hyn menjëherë.
export default function RivendosMeKod() {
  const { t } = useTranslation();
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

  async function ruaj() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.telefoni || gabimet.kodi || gabimet.fjalekalimi || gabimet.konfirmimi || !telefoni) return;
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

  return (
    <KornizaAuth titulli={t("rivendosja.titulli")} nentitulli={t("rivendosja.nentitulli")}>
      <GabimiIFormes mesazhi={gabimi} />
      <FushaETelefonit
        prefiksi={prefiksi}
        onPrefiksi={setPrefiksi}
        numri={numri}
        onNumri={setNumri}
        gabimi={provuar ? gabimet.telefoni : null}
      />
      <FushaTekstit
        etiketa={t("rivendosja.kodi")}
        ikona={ikonat.dryni}
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
    </KornizaAuth>
  );
}
