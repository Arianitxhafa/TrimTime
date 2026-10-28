import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useTema } from "../context/TemaContext";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  vlera: number;
  madhesia?: number;
  // Me onChange yjet bëhen të prekshëm (zgjedhja e vlerësimit).
  onChange?: (yjet: number) => void;
};

// Pesë yje: të mbushurat me ngjyrën e arit, të tjerat të zbehta. Vlera rrumbullakohet.
export default function Yjet({ vlera, madhesia = 14, onChange }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const plote = Math.round(vlera);

  return (
    <View
      style={[styles.rreshti, { gap: onChange ? madhesia * 0.35 : 2 }]}
      accessibilityRole={onChange ? "adjustable" : "image"}
      accessibilityLabel={`${vlera.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const ylli = (
          <Ikona emri={ikonat.yll} madhesia={madhesia} ngjyra={n <= plote ? ngjyrat.ari : ngjyrat.kufiri} />
        );
        return onChange ? (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={t(`vleresimet.yjet${n as 1 | 2 | 3 | 4 | 5}`)}
            accessibilityState={{ selected: n === plote }}
            onPress={() => onChange(n)}
            hitSlop={6}
          >
            {ylli}
          </Pressable>
        ) : (
          <View key={n}>{ylli}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rreshti: {
    flexDirection: "row",
    alignItems: "center",
  },
});
