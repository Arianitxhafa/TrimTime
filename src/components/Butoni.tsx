import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../context/TemaContext";
import { rrezja, type Ngjyrat } from "../theme";
import Ikona, { type EmriIkones } from "./Ikona";

type Varianti = "kryesor" | "dytesor" | "rrezik";

type Props = {
  titulli: string;
  onPress: () => void;
  varianti?: Varianti;
  ikona?: EmriIkones;
  joAktiv?: boolean;
  ngarkohet?: boolean;
  style?: StyleProp<ViewStyle>;
};

function ngjyratEVariantit(
  ngjyrat: Ngjyrat,
  varianti: Varianti,
): { sfondi: string; teksti: string; kufiri: string } {
  switch (varianti) {
    case "kryesor":
      return { sfondi: ngjyrat.ari, teksti: ngjyrat.mbiAri, kufiri: ngjyrat.ari };
    case "dytesor":
      return { sfondi: ngjyrat.siperfaqja2, teksti: ngjyrat.teksti, kufiri: ngjyrat.kufiri };
    case "rrezik":
      return { sfondi: ngjyrat.rrezikSfond, teksti: ngjyrat.rrezik, kufiri: ngjyrat.rrezikKufiri };
  }
}

export default function Butoni({
  titulli,
  onPress,
  varianti = "kryesor",
  ikona,
  joAktiv = false,
  ngarkohet = false,
  style,
}: Props) {
  const { ngjyrat } = useTema();
  const s = ngjyratEVariantit(ngjyrat, varianti);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: joAktiv || ngarkohet, busy: ngarkohet }}
      disabled={joAktiv || ngarkohet}
      onPress={onPress}
      style={({ pressed }) => [
        styles.butoni,
        { backgroundColor: s.sfondi, borderColor: s.kufiri },
        pressed && styles.shtypur,
        joAktiv && styles.joAktiv,
        style,
      ]}
    >
      {ngarkohet ? (
        <ActivityIndicator color={s.teksti} />
      ) : (
        ikona && <Ikona emri={ikona} madhesia={18} ngjyra={s.teksti} />
      )}
      <Text style={[styles.teksti, { color: s.teksti }]}>{titulli}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  butoni: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: rrezja.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shtypur: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  joAktiv: {
    opacity: 0.4,
  },
  teksti: {
    fontSize: 15,
    fontWeight: "700",
  },
});
