import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import { formatoCmimin, formatoKohezgjatjen } from "../lib/formatimi";
import type { TerminiILokalit } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import BadgeStatusi from "./BadgeStatusi";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  termini: TerminiILokalit;
  onPress: () => void;
};

export default function KartaTerminit({ termini, onPress }: Props) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const meta = statusetMeta[termini.statusi];
  const eZbehur = termini.statusi !== "ne_pritje" && termini.statusi !== "konfirmuar";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${termini.klienti_emri}, ${termini.ora_lokale}`}
      onPress={onPress}
      style={({ pressed }) => [styles.karta, pressed && styles.shtypur]}
    >
      <View style={styles.kolonaOres}>
        <Text style={[styles.ora, eZbehur && styles.zbehur]}>{termini.ora_lokale}</Text>
        <View style={[styles.vija, { backgroundColor: meta.ngjyra }]} />
      </View>

      <View style={styles.permbajtja}>
        <View style={styles.rreshtiSiper}>
          <Avatar emri={termini.klienti_emri} madhesia={40} />
          <View style={styles.emriKolona}>
            <Text style={[styles.klienti, eZbehur && styles.zbehur]} numberOfLines={1}>
              {termini.klienti_emri}
            </Text>
            <View style={styles.rreshtiInfo}>
              <Ikona emri={ikonat.gershere} madhesia={13} ngjyra={ngjyrat.tekstiDyte} />
              <Text style={styles.info} numberOfLines={1}>
                {termini.sherbimi_emri} · {termini.berberi_emri.split(" ")[0]}
              </Text>
            </View>
          </View>
          <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        </View>

        <View style={styles.rreshtiPoshte}>
          <BadgeStatusi statusi={termini.statusi} />
          {termini.arriti_me && (termini.statusi === "ne_pritje" || termini.statusi === "konfirmuar") ? (
            <View style={styles.arriti}>
              <Ikona emri={ikonat.skano} madhesia={12} ngjyra={ngjyrat.mbiAri} />
              <Text style={styles.arritiTeksti}>{t("qr.arriti")}</Text>
            </View>
          ) : null}
          {termini.foto_stili ? <Ikona emri={ikonat.kamera} madhesia={14} ngjyra={ngjyrat.ari} /> : null}
          <Text style={styles.detaje}>
            {formatoKohezgjatjen(termini.kohezgjatja_min)} · {formatoCmimin(termini.cmimi_centa)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      flexDirection: "row",
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginBottom: hapesira.md,
      gap: hapesira.md,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
      transform: [{ scale: 0.99 }],
    },
    arriti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      height: 24,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ari,
    },
    arritiTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 11,
      fontWeight: "800",
    },
    kolonaOres: {
      alignItems: "center",
      width: 48,
    },
    ora: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    vija: {
      flex: 1,
      width: 3,
      borderRadius: 2,
      marginTop: hapesira.sm,
      opacity: 0.8,
    },
    permbajtja: {
      flex: 1,
      gap: hapesira.md,
    },
    rreshtiSiper: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    emriKolona: {
      flex: 1,
      gap: 3,
    },
    klienti: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    rreshtiInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    info: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      flexShrink: 1,
    },
    zbehur: {
      color: ngjyrat.tekstiDyte,
    },
    rreshtiPoshte: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    detaje: {
      marginLeft: "auto",
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      fontWeight: "600",
    },
  });
