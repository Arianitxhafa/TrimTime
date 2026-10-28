import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../context/TemaContext";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Forca e turbullimit (iOS); në Android dhe web përdoret një mbushje gjysmë e tejdukshme.
  intensiteti?: number;
};

// Sipërfaqe "xham i turbullt" për etiketat mbi foto, kërkimin dhe kartat premium.
export default function Xham({ children, style, intensiteti = 40 }: Props) {
  const { ngjyrat, eshteErret } = useTema();

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensiteti}
        tint={eshteErret ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
        style={[styles.baza, { borderColor: ngjyrat.kufiriXham }, style]}
      >
        {children}
      </BlurView>
    );
  }

  return <View style={[styles.baza, { backgroundColor: ngjyrat.xham, borderColor: ngjyrat.kufiriXham }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  baza: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
