import { StyleSheet, Text, View } from "react-native";
import type { StatusiTerminit } from "../data/terminet";
import { useStilet, useTema } from "../context/TemaContext";
import { rrezja, type Ngjyrat } from "../theme";

export default function BadgeStatusi({ statusi }: { statusi: StatusiTerminit }) {
  const { statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const meta = statusetMeta[statusi];

  return (
    <View style={[styles.badge, { backgroundColor: meta.sfondi }]}>
      <View style={[styles.pika, { backgroundColor: meta.ngjyra }]} />
      <Text style={[styles.teksti, { color: meta.ngjyra }]}>{statusi}</Text>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
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
    fontSize: 12,
    fontWeight: "700",
  },
});
