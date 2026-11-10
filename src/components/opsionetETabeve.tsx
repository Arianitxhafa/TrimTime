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

// Shiriti i poshtëm: sipërfaqja e kartave, vijë e hollë sipër dhe etiketa që lexohen mirë.
export function useOpsionetETabeve(): OpsionetETabeve {
  const { ngjyrat } = useTema();
  return {
    headerShown: false,
    tabBarActiveTintColor: ngjyrat.ari,
    tabBarInactiveTintColor: ngjyrat.tekstiZbehte,
    tabBarStyle: {
      backgroundColor: ngjyrat.siperfaqja,
      borderTopColor: ngjyrat.kufiri,
      borderTopWidth: 1,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontFamily: shkronjat.etikete,
      fontSize: 12,
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
