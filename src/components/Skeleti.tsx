import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { useTema } from "../context/TemaContext";
import { hapesira, rrezja } from "../theme";

type Props = {
  gjeresia?: DimensionValue;
  lartesia: number;
  rrezja?: number;
  style?: StyleProp<ViewStyle>;
};

// Vend-mbajtës që "pulson" ndërsa ngarkohen të dhënat, në vend të një spinner-i.
export default function Skeleti({ gjeresia = "100%", lartesia, rrezja: r = rrezja.sm, style }: Props) {
  const { ngjyrat } = useTema();
  const dukshmeria = useSharedValue(0.45);

  useEffect(() => {
    dukshmeria.set(withRepeat(withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [dukshmeria]);

  const stili = useAnimatedStyle(() => ({ opacity: dukshmeria.get() }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: gjeresia, height: lartesia, borderRadius: r, backgroundColor: ngjyrat.siperfaqja2 }, stili, style]}
    />
  );
}

// Forma e një karte lokali gjatë ngarkimit të listës.
export function SkeletiIKartes() {
  const { ngjyrat } = useTema();
  return (
    <View style={[styles.karta, { backgroundColor: ngjyrat.siperfaqja, borderColor: ngjyrat.kufiri }]}>
      <Skeleti lartesia={190} rrezja={0} />
      <View style={styles.trupi}>
        <Skeleti gjeresia="60%" lartesia={18} />
        <Skeleti gjeresia="40%" lartesia={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  karta: {
    borderRadius: rrezja.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  trupi: {
    padding: hapesira.lg,
    gap: hapesira.sm,
  },
});
