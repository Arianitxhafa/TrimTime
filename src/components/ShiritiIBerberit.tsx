import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  gjeresia?: number;
  lartesia?: number;
  style?: StyleProp<ViewStyle>;
};

const NGJYRAT = ["#E5484D", "#F4F1EA", "#2F6FDE", "#F4F1EA"] as const;

// Shtylla e berberit: vija të kuqe, të bardha dhe blu, si te dera e Studios. Qëndron e palëvizshme.
export default function ShiritiIBerberit({ gjeresia = 120, lartesia = 10, style }: Props) {
  const vija = lartesia * 1.4;
  const sa = Math.ceil((gjeresia + lartesia * 2) / vija) + 1;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.korniza, { width: gjeresia, height: lartesia, borderRadius: lartesia / 2 }, style]}
    >
      <View style={[styles.rreshti, { marginLeft: -lartesia }]}>
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
      </View>
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
