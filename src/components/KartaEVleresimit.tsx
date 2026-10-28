import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePergjigjuVleresimit } from "../api/vleresimet";
import { useStilet, useTema } from "../context/TemaContext";
import { dataISO, formatoDaten } from "../lib/datat";
import type { Vleresimi } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import Butoni from "./Butoni";
import FushaTekstit from "./FushaTekstit";
import Ikona, { ikonat } from "./Ikona";
import { GabimiIFormes } from "./KornizaAuth";
import Yjet from "./Yjet";

type Props = {
  vleresimi: Vleresimi;
  // Vetëm pronari i lokalit sheh butonin "Përgjigju".
  mundTePergjigjet?: boolean;
};

export default function KartaEVleresimit({ vleresimi, mundTePergjigjet = false }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const pergjigju = usePergjigjuVleresimit();
  const [duke, setDuke] = useState(false);
  const [teksti, setTeksti] = useState(vleresimi.pergjigjja ?? "");

  function ruaj() {
    pergjigju.mutate({ vleresimiId: vleresimi.id, pergjigjja: teksti }, { onSuccess: () => setDuke(false) });
  }

  return (
    <View style={styles.karta}>
      <View style={styles.koka}>
        <Avatar emri={vleresimi.klienti_emri} madhesia={36} />
        <View style={styles.kokaTeksti}>
          <Text style={styles.emri}>{vleresimi.klienti_emri}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {formatoDaten(dataISO(new Date(vleresimi.krijuar_me)), t)} · {vleresimi.sherbimi_emri}
          </Text>
        </View>
        <Yjet vlera={vleresimi.yjet} madhesia={13} />
      </View>

      {vleresimi.komenti ? <Text style={styles.komenti}>{vleresimi.komenti}</Text> : null}

      {vleresimi.pergjigjja && !duke ? (
        <View style={styles.pergjigjja}>
          <View style={styles.pergjigjjaKoka}>
            <Ikona emri={ikonat.pergjigju} madhesia={13} ngjyra={ngjyrat.ari} />
            <Text style={styles.pergjigjjaTitulli}>{t("vleresimet.pergjigjjaELokalit")}</Text>
          </View>
          <Text style={styles.pergjigjjaTeksti}>{vleresimi.pergjigjja}</Text>
        </View>
      ) : null}

      {mundTePergjigjet &&
        (duke ? (
          <View style={styles.forma}>
            <FushaTekstit
              etiketa={t("vleresimet.pergjigju")}
              placeholder={t("vleresimet.pergjigjjaShembull")}
              value={teksti}
              onChangeText={setTeksti}
              maxLength={1000}
              shumeRreshta
              autoFocus
            />
            <GabimiIFormes mesazhi={pergjigju.isError ? t("pergjithshme.gabimPapritur") : null} />
            <View style={styles.butonat}>
              <View style={styles.butoni}>
                <Butoni titulli={t("pergjithshme.anulo")} varianti="dytesor" onPress={() => setDuke(false)} />
              </View>
              <View style={styles.butoni}>
                <Butoni titulli={t("vleresimet.ruajPergjigjen")} ngarkohet={pergjigju.isPending} onPress={ruaj} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setDuke(true)} hitSlop={8} style={styles.lidhja}>
            <Ikona emri={ikonat.pergjigju} madhesia={14} ngjyra={ngjyrat.ari} />
            <Text style={styles.lidhjaTeksti}>
              {vleresimi.pergjigjja ? t("vleresimet.ndryshoPergjigjen") : t("vleresimet.pergjigju")}
            </Text>
          </Pressable>
        ))}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    kokaTeksti: {
      flex: 1,
      gap: 2,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    meta: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
    },
    komenti: {
      color: ngjyrat.teksti,
      fontSize: 15,
      lineHeight: 22,
    },
    pergjigjja: {
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.md,
      padding: hapesira.md,
      gap: 6,
    },
    pergjigjjaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    pergjigjjaTitulli: {
      color: ngjyrat.ari,
      fontSize: 12,
      fontWeight: "700",
    },
    pergjigjjaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    forma: {
      gap: hapesira.sm,
    },
    butonat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    butoni: {
      flex: 1,
    },
    lidhja: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
    },
    lidhjaTeksti: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
    },
  });
