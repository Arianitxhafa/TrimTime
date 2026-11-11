import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import KornizaAuth, { GabimiIFormes } from "../components/KornizaAuth";
import { useStilet } from "../context/TemaContext";
import { emailIVlefshem, mesazhiIGabimit } from "../lib/gabimetEAuth";
import { supabase } from "../lib/supabase";
import { shkronjat, type Ngjyrat } from "../theme";

// Hapi i parë i rivendosjes: Supabase dërgon një lidhje që hap aplikacionin te "fjalekalimi-i-ri".
export default function Rivendos() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const { email: emailNgaHyrja } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailNgaHyrja ?? "");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);
  const [uDergua, setUDergua] = useState(false);

  const gabimiEmailit = emailIVlefshem(email) ? null : t("auth.gabimEmail");

  async function dergo() {
    setProvuar(true);
    setGabimi(null);
    if (gabimiEmailit) return;
    setNgarkohet(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL("/fjalekalimi-i-ri"),
    });
    setNgarkohet(false);
    // Për privatësi, mesazhi është i njëjtë edhe kur email-i nuk ka llogari.
    if (error) setGabimi(mesazhiIGabimit(error, t));
    else setUDergua(true);
  }

  return (
    <KornizaAuth titulli={t("auth.rivendosTitulli")} nentitulli={t("auth.rivendosTeksti")}>
      <GabimiIFormes mesazhi={gabimi} />
      {uDergua ? (
        <>
          <Text style={styles.uDergua}>{t("auth.uDergua")}</Text>
          <Butoni titulli={t("auth.kthehuTeHyrja")} varianti="dytesor" onPress={() => router.back()} />
        </>
      ) : (
        <>
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
            returnKeyType="send"
            onSubmitEditing={dergo}
            gabimi={provuar ? gabimiEmailit : null}
          />
          <Butoni titulli={t("auth.dergo")} onPress={dergo} ngarkohet={ngarkohet} />
        </>
      )}
    </KornizaAuth>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    uDergua: {
      ...shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 18,
      lineHeight: 26,
      marginBottom: 24,
    },
  });
