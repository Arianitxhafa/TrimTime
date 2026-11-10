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

const krijoStilet = (_ngjyrat: Ngjyrat) =>
  StyleSheet.create({
  // Kapsulë me ngjyrën e statusit.
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: rrezja.plote,
    alignSelf: "flex-start",
  },
  pika: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  teksti: {
    ...shkronjat.etiketeBold,
    fontSize: 12,
  },
});
