import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import type { StatusiTerminit } from "../lib/tipet";
import { rrezja, shkronjat, type Ngjyrat } from "../theme";

export default function BadgeStatusi({ statusi }: { statusi: StatusiTerminit }) {
  const { t } = useTranslation();
  const { statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const meta = statusetMeta[statusi];

  return (
    <View style={[styles.badge, { backgroundColor: meta.sfondi }]}>
      <View style={[styles.pika, { backgroundColor: meta.ngjyra }]} />
      <Text style={[styles.teksti, { color: meta.ngjyra }]}>{t(`statuset.${statusi}`)}</Text>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
  // Vulë e vogël me shkronja mono, si etiketë e shtypur.
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: rrezja.plote,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    alignSelf: "flex-start",
  },
  pika: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  teksti: {
    fontFamily: shkronjat.monoBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
