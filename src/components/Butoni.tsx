import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { prekja } from "../lib/prekja";
import { hijet, rrezja, type Ngjyrat } from "../theme";
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
      return { sfondi: ngjyrat.ari, teksti: ngjyrat.mbiAri, kufiri: "transparent" };
    case "dytesor":
      return { sfondi: ngjyrat.siperfaqja2, teksti: ngjyrat.teksti, kufiri: ngjyrat.kufiri };
    case "rrezik":
      return { sfondi: ngjyrat.rrezikSfond, teksti: ngjyrat.rrezik, kufiri: ngjyrat.rrezikKufiri };
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Butoni kryesor ka gradient ari dhe hije të artë; çdo buton "shtypet" me animacion dhe dridhje.
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
  const shtypja = useShtypja();
  const kryesor = varianti === "kryesor";

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: joAktiv || ngarkohet, busy: ngarkohet }}
      disabled={joAktiv || ngarkohet}
      onPressIn={shtypja.onPressIn}
      onPressOut={shtypja.onPressOut}
      onPress={() => {
        if (varianti === "rrezik") prekja.mesatare();
        else prekja.lehte();
        onPress();
      }}
      style={[
        styles.butoni,
        { backgroundColor: s.sfondi, borderColor: s.kufiri },
        kryesor && !joAktiv && hijet.ari,
        joAktiv && styles.joAktiv,
        shtypja.stili,
        style,
      ]}
    >
      {kryesor && (
        <LinearGradient
          colors={ngjyrat.gradientiAri}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradienti]}
        />
      )}
      {ngarkohet ? (
        <ActivityIndicator color={s.teksti} />
      ) : (
        ikona && <Ikona emri={ikona} madhesia={18} ngjyra={s.teksti} />
      )}
      <Text style={[styles.teksti, { color: s.teksti }]}>{titulli}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  butoni: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: rrezja.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "visible",
  },
  gradienti: {
    borderRadius: rrezja.md,
  },
  joAktiv: {
    opacity: 0.4,
  },
  teksti: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
