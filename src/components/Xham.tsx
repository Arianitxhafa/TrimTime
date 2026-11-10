import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../context/TemaContext";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Mbetet për pajtueshmëri; revista nuk përdor turbullim.
  intensiteti?: number;
};

// Etiketë e butë mbi foto ose në kokë të ekranit.
export default function Xham({ children, style }: Props) {
  const { ngjyrat } = useTema();
  return (
    <View style={[styles.baza, { backgroundColor: ngjyrat.xham, borderColor: ngjyrat.kufiriXham }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  baza: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 12,
  },
});
