import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { prekja } from "../lib/prekja";
import { rrezja, shkronjat, type Ngjyrat } from "../theme";
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
      return { sfondi: "transparent", teksti: ngjyrat.teksti, kufiri: ngjyrat.vija };
    case "rrezik":
      return { sfondi: "transparent", teksti: ngjyrat.rrezik, kufiri: ngjyrat.rrezik };
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Butoni i revistës: drejtkëndësh me bojë të zezë (ose vetëm kornizë), shkronja mono të mëdha
// dhe shigjetë te butoni kryesor. Shtypet me animacion dhe dridhje.
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

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={titulli}
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
        joAktiv && styles.joAktiv,
        shtypja.stili,
        style,
      ]}
    >
      {ngarkohet ? (
        <ActivityIndicator color={s.teksti} />
      ) : (
        ikona && <Ikona emri={ikona} madhesia={17} ngjyra={s.teksti} />
      )}
      <Text style={[styles.teksti, { color: s.teksti }]} numberOfLines={1}>
        {titulli}
      </Text>
      {varianti === "kryesor" && !ngarkohet ? (
        <View style={styles.shigjeta}>
          <Text style={[styles.teksti, { color: s.teksti }]}>→</Text>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  butoni: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: rrezja.sm,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  joAktiv: {
    opacity: 0.35,
  },
  teksti: {
    fontFamily: shkronjat.monoBold,
    fontSize: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  shigjeta: {
    marginLeft: 2,
  },
});
