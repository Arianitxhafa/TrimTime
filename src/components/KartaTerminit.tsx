import { Pressable, StyleSheet, Text, View } from "react-native";
import { gjejSherbimin, type Termini } from "../data/terminet";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import BadgeStatusi from "./BadgeStatusi";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  termini: Termini;
  onPress: () => void;
};

export default function KartaTerminit({ termini, onPress }: Props) {
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const sherbimi = gjejSherbimin(termini.sherbimi);
  const meta = statusetMeta[termini.statusi];
  const eZbehur = termini.statusi === "Përfunduar" || termini.statusi === "Anuluar";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Termini i ${termini.klienti} në orën ${termini.ora}`}
      onPress={onPress}
      style={({ pressed }) => [styles.karta, pressed && styles.shtypur]}
    >
      <View style={styles.kolonaOres}>
        <Text style={[styles.ora, eZbehur && styles.zbehur]}>{termini.ora}</Text>
        <View style={[styles.vija, { backgroundColor: meta.ngjyra }]} />
      </View>

      <View style={styles.permbajtja}>
        <View style={styles.rreshtiSiper}>
          <Avatar emri={termini.klienti} madhesia={40} />
          <View style={styles.emriKolona}>
            <Text style={[styles.klienti, eZbehur && styles.zbehur]} numberOfLines={1}>
              {termini.klienti}
            </Text>
            <View style={styles.rreshtiInfo}>
              <Ikona emri={ikonat.gershere} madhesia={13} ngjyra={ngjyrat.tekstiDyte} />
              <Text style={styles.info} numberOfLines={1}>
                {termini.sherbimi}
              </Text>
            </View>
          </View>
          <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        </View>

        <View style={styles.rreshtiPoshte}>
          <BadgeStatusi statusi={termini.statusi} />
          {sherbimi && (
            <Text style={styles.detaje}>
              {sherbimi.kohezgjatja} min · €{sherbimi.cmimi}
            </Text>
          )}
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
    justifyContent: "space-between",
  },
  detaje: {
    color: ngjyrat.tekstiZbehte,
    fontSize: 12,
    fontWeight: "600",
  },
});
