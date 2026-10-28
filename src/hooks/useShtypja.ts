import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

// Animacioni i "shtypjes": elementi zvogëlohet pak nën gisht dhe kthehet me sustë.
// Përdor .set()/.get() (jo .value), që React Compiler të mos e shohë si ndryshim të gabuar.
export function useShtypja(shkallaEShtypur = 0.97) {
  const shkalla = useSharedValue(1);
  const stili = useAnimatedStyle(() => ({ transform: [{ scale: shkalla.get() }] }));
  return {
    stili,
    onPressIn: () => shkalla.set(withSpring(shkallaEShtypur, { damping: 18, stiffness: 400 })),
    onPressOut: () => shkalla.set(withSpring(1, { damping: 14, stiffness: 300 })),
  };
}
