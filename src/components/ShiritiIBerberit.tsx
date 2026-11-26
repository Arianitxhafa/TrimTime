import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

type Props = {
  gjeresia?: number;
  lartesia?: number;
  style?: StyleProp<ViewStyle>;
};

const NGJYRAT = ["#E5484D", "#F4F1EA", "#2F6FDE", "#F4F1EA"] as const;

// Shtylla e berberit: vija të kuqe, të bardha dhe blu që rrëshqasin pa fund, si te dera e Studios.
export default function ShiritiIBerberit({ gjeresia = 120, lartesia = 10, style }: Props) {
  const vija = lartesia * 1.4;
  const perioda = vija * NGJYRAT.length;
  const zhvendosja = useSharedValue(0);

  useEffect(() => {
    zhvendosja.set(withRepeat(withTiming(perioda, { duration: 1400, easing: Easing.linear }), -1, false));
  }, [perioda, zhvendosja]);

  const stili = useAnimatedStyle(() => ({ transform: [{ translateX: zhvendosja.get() - perioda }] }));
  const sa = Math.ceil((gjeresia + perioda * 2) / vija);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.korniza, { width: gjeresia, height: lartesia, borderRadius: lartesia / 2 }, style]}
    >
      <Animated.View style={[styles.rreshti, stili]}>
        {Array.from({ length: sa }, (_, i) => (
          <View
            key={i}
            style={{
              width: vija,
              height: lartesia * 3,
              marginTop: -lartesia,
              backgroundColor: NGJYRAT[i % NGJYRAT.length],
              transform: [{ skewX: "-35deg" }],
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  korniza: {
    overflow: "hidden",
    backgroundColor: "#F4F1EA",
  },
  rreshti: {
    flexDirection: "row",
  },
});
