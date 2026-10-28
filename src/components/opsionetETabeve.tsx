import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useTema } from "../context/TemaContext";
import type { ColorValue } from "react-native";
import { prekja } from "../lib/prekja";
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
      backgroundColor: ngjyrat.sfondi,
      borderTopColor: ngjyrat.kufiriXham,
      paddingTop: 6,
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
    sceneStyle: { backgroundColor: ngjyrat.sfondi },
  };
}

// Dridhje e lehtë kur ndërrohet tab-i.
export const degjuesitETabeve = { tabPress: () => prekja.zgjedhje() };

export function ikonaETabit(emri: EmriIkones) {
  return function IkonaETabit({ color }: { color: ColorValue }) {
    return <Ikona emri={emri} madhesia={23} ngjyra={color} />;
  };
}
