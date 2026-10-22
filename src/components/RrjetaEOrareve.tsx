import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import type { OraELire } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  oraret: OraELire[] | undefined;
  ngarkohet: boolean;
  zgjedhur: string | null;
  onZgjidh: (ora: OraELire) => void;
};

export default function RrjetaEOrareve({ oraret, ngarkohet, zgjedhur, onZgjidh }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  if (ngarkohet && !oraret) {
    return <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />;
  }

  if (!oraret || oraret.length === 0) {
    return (
      <View style={styles.bosh}>
        <Ikona emri={ikonat.ora} madhesia={22} ngjyra={ngjyrat.tekstiDyte} />
        <Text style={styles.boshTitulli}>{t("rezervimi.paOrare")}</Text>
        <Text style={styles.boshTeksti}>{t("rezervimi.paOrareTeksti")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.rrjeta}>
      {oraret.map((o) => {
        const aktiv = o.fillon_me === zgjedhur;
        return (
          <Pressable
            key={o.fillon_me}
            accessibilityRole="radio"
            accessibilityState={{ selected: aktiv }}
            onPress={() => onZgjidh(o)}
            style={({ pressed }) => [styles.ora, aktiv && styles.oraAktive, pressed && styles.shtypur]}
          >
            <Text style={[styles.oraTeksti, aktiv && styles.oraTekstiAktiv]}>{o.ora}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    ngarkimi: {
      paddingVertical: hapesira.xl,
    },
    rrjeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    ora: {
      width: "23%",
      flexGrow: 1,
      maxWidth: "25%",
      height: 46,
      borderRadius: rrezja.sm,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
    },
    oraAktive: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    shtypur: {
      opacity: 0.8,
    },
    oraTeksti: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    oraTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    bosh: {
      alignItems: "center",
      gap: 6,
      paddingVertical: hapesira.xl,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      textAlign: "center",
      paddingHorizontal: hapesira.lg,
    },
  });
