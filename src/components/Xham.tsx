import { BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../context/TemaContext";

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Fortësia e turbullimit në iOS para versionit 26 (1–100).
  intensiteti?: number;
  // Ngjyrim i lehtë i xhamit (p.sh. ngjyra e tab-it).
  ngjyrimi?: ColorValue;
  // Xhami reagon ndaj prekjes (shkëlqen dhe zmadhohet pak), si butonat e iOS 26.
  iPrekshem?: boolean;
};

// Liquid Glass ekziston vetëm në iOS 26+. Kontrollohet një herë: përgjigjja nuk ndryshon gjatë punës.
// isGlassEffectAPIAvailable mbron nga versionet beta të iOS 26 ku API-ja mungon.
const KA_LIQUID_GLASS = Platform.OS === "ios" && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Sipërfaqe prej xhami: Liquid Glass në iOS 26+, turbullim i sistemit në iOS më të vjetër dhe
// mbushje gjysmë e tejdukshme në Android dhe web. Rrezja e këndeve vjen nga `style`.
export default function Xham({ children, style, intensiteti = 60, ngjyrimi, iPrekshem = false }: Props) {
  const { ngjyrat, eshteErret } = useTema();

  if (KA_LIQUID_GLASS) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={eshteErret ? "dark" : "light"}
        tintColor={ngjyrimi}
        isInteractive={iPrekshem}
        style={[styles.baza, style]}
      >
        {children}
      </GlassView>
    );
  }

  // Pa Liquid Glass, xhami i ngjyrosur bëhet sipërfaqe me ngjyrë të plotë: përmbajtja mbi të
  // (ikona e bardhë) lexohet njësoj në çdo telefon.
  if (ngjyrimi) {
    return <View style={[styles.baza, { backgroundColor: ngjyrimi }, style]}>{children}</View>;
  }

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensiteti}
        tint={eshteErret ? "systemMaterialDark" : "systemMaterialLight"}
        style={[styles.baza, styles.meKufi, { borderColor: ngjyrat.kufiriXham }, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.baza, styles.meKufi, { backgroundColor: ngjyrat.xham, borderColor: ngjyrat.kufiriXham }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  baza: {
    overflow: "hidden",
    borderRadius: 12,
    borderCurve: "continuous",
  },
  meKufi: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
