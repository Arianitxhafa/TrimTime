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
import HyrjaMeRadhe from "../components/HyrjaMeRadhe";
import EkraniINgarkimit from "../components/EkraniINgarkimit";
import { useEmailIRikuperimit, useRuajEmailinERikuperimit } from "../api/rivendosja";
import { emailIVlefshem } from "../lib/gabimetEAuth";
import { eshteEmailITelefonit, telefoniNgaEmaili } from "../lib/telefoni";

// Emri, telefoni dhe email-i i rikuperimit (për fjalëkalimin e harruar te llogaritë me telefon).
export default function ProfiliIm() {
  const rikuperimi = useEmailIRikuperimit();
  if (rikuperimi.isPending) return <EkraniINgarkimit pyetjet={[rikuperimi]} />;
  return <Forma emailIRikuperimit={rikuperimi.data ?? ""} />;
}

function Forma({ emailIRikuperimit }: { emailIRikuperimit: string }) {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const { profili, emriIShfaqur, sesioni, ruajProfilin } = useAuth();
  const [emri, setEmri] = useState(profili?.emri || (emriIShfaqur.includes("@") ? "" : emriIShfaqur));
  const [telefoni, setTelefoni] = useState(profili?.telefoni ?? "");
  const [email, setEmail] = useState(emailIRikuperimit);
  const ruajEmailin = useRuajEmailinERikuperimit();
  const meTelefon = eshteEmailITelefonit(sesioni?.user.email);
  const [provuar, setProvuar] = useState(false);
  const [ngarkohet, setNgarkohet] = useState(false);
  const [gabimi, setGabimi] = useState<string | null>(null);

  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("auth.gabimEmri"),
    telefoni: telefoni.trim() === "" || /^\+?[\d\s()-]{6,20}$/.test(telefoni.trim()) ? null : t("profili.gabimTelefoni"),
    email: email.trim() === "" || emailIVlefshem(email) ? null : t("auth.gabimEmail"),
  };

  async function ruaj() {
    setProvuar(true);
    setGabimi(null);
    if (gabimet.emri || gabimet.telefoni || gabimet.email) return;
    setNgarkohet(true);
    try {
      await ruajProfilin({ emri: emri.trim(), telefoni: telefoni.trim() || null });
      if (meTelefon && email.trim() !== emailIRikuperimit) await ruajEmailin.mutateAsync(email.trim() || null);
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
        <HyrjaMeRadhe>
        <Text style={styles.email}>
          {meTelefon && sesioni?.user.email ? telefoniNgaEmaili(sesioni.user.email) : sesioni?.user.email}
        </Text>
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
        {meTelefon ? (
          <>
            <FushaTekstit
              etiketa={t("rivendosja.emailOpsional")}
              ikona={ikonat.email}
              value={email}
              onChangeText={setEmail}
              placeholder="emri@shembull.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              gabimi={provuar ? gabimet.email : null}
            />
            <Text style={styles.shenim}>{t("rivendosja.emailShenim")}</Text>
          </>
        ) : null}
        <Butoni titulli={t("profili.ruaj")} onPress={ruaj} ngarkohet={ngarkohet} />
        </HyrjaMeRadhe>
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
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      letterSpacing: 0.5,
      marginBottom: hapesira.xl,
    },
    shenim: {
      ...shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: hapesira.xl,
    },
  });
