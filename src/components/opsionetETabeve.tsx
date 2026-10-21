import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useTema } from "../context/TemaContext";
import type { ColorValue } from "react-native";
import Ikona, { type EmriIkones } from "./Ikona";

type OpsionetETabeve = Exclude<
  NonNullable<ComponentProps<typeof Tabs>["screenOptions"]>,
  (...args: never[]) => unknown
>;

// Stili i përbashkët i tab-eve për modin e klientit dhe të biznesit.
export function useOpsionetETabeve(): OpsionetETabeve {
  const { ngjyrat } = useTema();
  return {
    headerShown: false,
    tabBarActiveTintColor: ngjyrat.ari,
    tabBarInactiveTintColor: ngjyrat.tekstiZbehte,
    tabBarStyle: {
      backgroundColor: ngjyrat.siperfaqja,
      borderTopColor: ngjyrat.kufiri,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    sceneStyle: { backgroundColor: ngjyrat.sfondi },
  };
}

export function ikonaETabit(emri: EmriIkones) {
  return function IkonaETabit({ color }: { color: ColorValue }) {
    return <Ikona emri={emri} madhesia={22} ngjyra={color} />;
  };
}
