import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useTema } from "../context/TemaContext";
import type { ColorValue } from "react-native";
import { prekja } from "../lib/prekja";
import { shkronjat } from "../theme";
import Ikona, { type EmriIkones } from "./Ikona";

type OpsionetETabeve = Exclude<
  NonNullable<ComponentProps<typeof Tabs>["screenOptions"]>,
  (...args: never[]) => unknown
>;

// Shiriti i poshtëm si fundi i faqes: letër, vijë boje sipër dhe etiketa mono të mëdha.
export function useOpsionetETabeve(): OpsionetETabeve {
  const { ngjyrat } = useTema();
  return {
    headerShown: false,
    tabBarActiveTintColor: ngjyrat.teksti,
    tabBarInactiveTintColor: ngjyrat.tekstiZbehte,
    tabBarStyle: {
      backgroundColor: ngjyrat.sfondi,
      borderTopColor: ngjyrat.vija,
      borderTopWidth: 1.5,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontFamily: shkronjat.monoBold,
      fontSize: 10,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    sceneStyle: { backgroundColor: ngjyrat.sfondi },
  };
}

// Dridhje e lehtë kur ndërrohet tab-i.
export const degjuesitETabeve = { tabPress: () => prekja.zgjedhje() };

export function ikonaETabit(emri: EmriIkones) {
  return function IkonaETabit({ color }: { color: ColorValue }) {
    return <Ikona emri={emri} madhesia={22} ngjyra={color} />;
  };
}
