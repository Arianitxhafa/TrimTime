import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { ikonat } from "../../components/Ikona";
import { ikonaETabit, useOpsionetETabeve } from "../../components/opsionetETabeve";

export default function KlientLayout() {
  const { t } = useTranslation();
  const opsionet = useOpsionetETabeve();

  return (
    <Tabs screenOptions={opsionet}>
      <Tabs.Screen name="zbulo" options={{ title: t("tabs.zbulo"), tabBarIcon: ikonaETabit(ikonat.zbulo) }} />
      <Tabs.Screen name="harta" options={{ title: t("tabs.harta"), tabBarIcon: ikonaETabit(ikonat.harta) }} />
      <Tabs.Screen
        name="terminet-e-mia"
        options={{ title: t("tabs.terminet"), tabBarIcon: ikonaETabit(ikonat.kalendar) }}
      />
      <Tabs.Screen name="profili" options={{ title: t("tabs.profili"), tabBarIcon: ikonaETabit(ikonat.personi) }} />
    </Tabs>
  );
}
