import type { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";

type OpsionetEStackut = Exclude<
  NonNullable<ComponentProps<typeof Stack>["screenOptions"]>,
  (...args: never[]) => unknown
>;

// Stack-u brenda çdo tab-i: titull i madh që tkurret kur lëviz, si te aplikacionet e Apple.
// Lista e ekranit duhet të ketë contentInsetAdjustmentBehavior="automatic".
export function useOpsionetEStackut(): OpsionetEStackut {
  const { ngjyrat } = useTema();
  return {
    headerLargeTitleEnabled: true,
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerTransparent: false,
    headerStyle: { backgroundColor: ngjyrat.sfondi },
    headerTintColor: ngjyrat.ari,
    headerTitleStyle: { color: ngjyrat.teksti, ...shkronjat.titullBold, fontSize: 17 },
    headerLargeTitleStyle: { color: ngjyrat.teksti },
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: ngjyrat.sfondi },
  };
}
