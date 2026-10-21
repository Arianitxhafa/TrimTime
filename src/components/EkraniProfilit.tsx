import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { usePreferencat, type Modi } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import DialogKonfirmimi from "./DialogKonfirmimi";
import Ikona, { ikonat, type EmriIkones } from "./Ikona";

const modet = [
  { vlera: "klient", titulli: "profili.modiKlient", pershkrimi: "profili.modiKlientPershkrimi", ikona: ikonat.gershere },
  { vlera: "biznes", titulli: "profili.modiBiznes", pershkrimi: "profili.modiBiznesPershkrimi", ikona: ikonat.lokali },
] as const satisfies readonly { vlera: Modi; titulli: string; pershkrimi: string; ikona: EmriIkones }[];

export default function EkraniProfilit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { sesioni, emriIShfaqur, dil } = useAuth();
  const { modi, ndryshoModin } = usePreferencat();
  const [dialogu, setDialogu] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.permbajtja, { paddingTop: insets.top + hapesira.xl }]}
      >
        <View style={styles.koka}>
          <Avatar emri={emriIShfaqur || t("profili.perdorues")} madhesia={84} />
          <Text style={styles.emri}>{emriIShfaqur || t("profili.perdorues")}</Text>
          {sesioni?.user.email ? <Text style={styles.email}>{sesioni.user.email}</Text> : null}
        </View>

        <Text style={styles.seksioni}>{t("profili.modi")}</Text>
        <View accessibilityRole="radiogroup" style={styles.modet}>
          {modet.map((m) => {
            const aktiv = modi === m.vlera;
            return (
              <Pressable
                key={m.vlera}
                accessibilityRole="radio"
                accessibilityState={{ selected: aktiv }}
                onPress={() => ndryshoModin(m.vlera)}
                style={({ pressed }) => [styles.modi, aktiv && styles.modiAktiv, pressed && styles.shtypur]}
              >
                <View style={[styles.modiIkona, aktiv && styles.modiIkonaAktive]}>
                  <Ikona emri={m.ikona} madhesia={20} ngjyra={aktiv ? ngjyrat.mbiAri : ngjyrat.tekstiDyte} />
                </View>
                <Text style={styles.modiTitulli}>{t(m.titulli)}</Text>
                <Text style={styles.modiPershkrimi}>{t(m.pershkrimi)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.seksioni}>{t("profili.llogaria")}</Text>
        <View style={styles.grupi}>
          <Rreshti
            ikona={ikonat.cilesimet}
            titulli={t("profili.cilesimet")}
            onPress={() => router.push("/cilesimet")}
          />
          <Rreshti ikona={ikonat.dil} titulli={t("profili.dil")} rrezik meKufi onPress={() => setDialogu(true)} />
        </View>
      </ScrollView>

      <DialogKonfirmimi
        iDukshem={dialogu}
        titulli={t("profili.dilTitulli")}
        mesazhi={t("profili.dilMesazhi")}
        tekstiKonfirmimit={t("profili.dilKonfirmo")}
        rrezik
        onAnulo={() => setDialogu(false)}
        onKonfirmo={() => {
          setDialogu(false);
          dil();
        }}
      />
    </View>
  );
}

type RreshtiProps = {
  ikona: EmriIkones;
  titulli: string;
  rrezik?: boolean;
  meKufi?: boolean;
  onPress: () => void;
};

function Rreshti({ ikona, titulli, rrezik = false, meKufi = false, onPress }: RreshtiProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ngjyra = rrezik ? ngjyrat.rrezik : ngjyrat.teksti;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rreshti, meKufi && styles.rreshtiMeKufi, pressed && styles.shtypur]}
    >
      <Ikona emri={ikona} madhesia={20} ngjyra={ngjyra} />
      <Text style={[styles.rreshtiTeksti, { color: ngjyra }]}>{titulli}</Text>
      {!rrezik && <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />}
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    koka: {
      alignItems: "center",
      gap: hapesira.sm,
      marginBottom: hapesira.xxl,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
      marginTop: hapesira.xs,
      textAlign: "center",
    },
    email: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    modet: {
      flexDirection: "row",
      gap: hapesira.md,
      marginBottom: hapesira.xxl,
    },
    modi: {
      flex: 1,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: 4,
    },
    modiAktiv: {
      borderColor: ngjyrat.ari,
      backgroundColor: ngjyrat.ariIErret,
    },
    modiIkona: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    modiIkonaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    modiTitulli: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "800",
    },
    modiPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      lineHeight: 17,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.lg,
      height: 56,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    rreshtiTeksti: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
    },
    shtypur: {
      opacity: 0.85,
    },
  });
