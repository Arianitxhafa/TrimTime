import { Children, type ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = {
  children: ReactNode;
  // Pritja para elementit të parë dhe mes elementeve, në milisekonda.
  vonesa?: number;
  hapi?: number;
};

// Elementet e një ekrani hyjnë njëri pas tjetrit nga poshtë, si te aplikacionet e Apple.
// Përdoret brenda një ScrollView vertikale: çdo fëmijë mbështillet në një Animated.View.
export default function HyrjaMeRadhe({ children, vonesa = 0, hapi = 55 }: Props) {
  return (
    <>
      {Children.toArray(children).map((femija, i) => (
        <Animated.View key={i} entering={FadeInDown.delay(vonesa + Math.min(i, 12) * hapi).duration(380)}>
          {femija}
        </Animated.View>
      ))}
    </>
  );
}
