import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import { GabimiIFormes } from "../components/KornizaAuth";
import { useAuth } from "../context/AuthContext";
import { useStilet } from "../context/TemaContext";
import { prekja } from "../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";

// Emri dhe telefoni i përdoruesit: telefoni i duhet lokalit për ta kontaktuar për terminin.
export default function ProfiliIm() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const { profili, emriIShfaqur, sesioni, ruajProfilin } = useAuth();
  const [emri, setEmri] = useState(profili?.emri || (emriIShfaqur.includes("@") ? "" : emriIShfaqur));
  const [telefoni, setTelefoni] = useState(profili?.telefoni ?? "");
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("auth.gabimEmri"),
    telefoni: telefoni.trim() === "" || /^\+?[\d\s()-]{6,20}$/.test(telefoni.trim()) ? null : t("profili.gabimTelefoni"),
  };

  async function ruaj() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.emri || gabimet.telefoni) return;
    setNgarkohet(true);
    try {
      await ruajProfilin({ emri: emri.trim(), telefoni: telefoni.trim() || null });
      prekja.sukses();
      router.back();
    } catch {
      setGabimi(t("pergjithshme.gabimPapritur"));
    } finally {
      setNgarkohet(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <Text style={styles.email}>{sesioni?.user.email}</Text>
        <GabimiIFormes mesazhi={gabimi} />
        <FushaTekstit
          etiketa={t("auth.emri")}
          ikona={ikonat.personi}
          value={emri}
          onChangeText={setEmri}
          maxLength={80}
          autoComplete="name"
          textContentType="name"
          gabimi={provuar ? gabimet.emri : null}
        />
        <FushaTekstit
          etiketa={t("profili.telefoni")}
          ikona={ikonat.telefoni}
          value={telefoni}
          onChangeText={setTelefoni}
          placeholder="+383 44 123 456"
          keyboardType="phone-pad"
          maxLength={30}
          autoComplete="tel"
          textContentType="telephoneNumber"
          gabimi={provuar ? gabimet.telefoni : null}
        />
        <Text style={styles.shenim}>{t("profili.telefoniTeksti")}</Text>
        <Butoni titulli={t("profili.ruaj")} onPress={ruaj} ngarkohet={ngarkohet} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      padding: hapesira.xl,
    },
    email: {
      fontFamily: shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      letterSpacing: 0.5,
      marginBottom: hapesira.xl,
    },
    shenim: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: hapesira.xl,
    },
  });
