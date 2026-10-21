import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { ikonat } from "../../components/Ikona";
import { ikonaETabit, useOpsionetETabeve } from "../../components/opsionetETabeve";

export default function BiznesLayout() {
  const { t } = useTranslation();
  const opsionet = useOpsionetETabeve();

  return (
    <Tabs screenOptions={opsionet}>
      <Tabs.Screen name="sot" options={{ title: t("tabs.sot"), tabBarIcon: ikonaETabit(ikonat.sot) }} />
      <Tabs.Screen
        name="kalendari"
        options={{ title: t("tabs.kalendari"), tabBarIcon: ikonaETabit(ikonat.kalendar) }}
      />
      <Tabs.Screen
        name="klientet"
        options={{ title: t("tabs.klientet"), tabBarIcon: ikonaETabit(ikonat.klientet) }}
      />
      <Tabs.Screen name="lokali" options={{ title: t("tabs.lokali"), tabBarIcon: ikonaETabit(ikonat.lokali) }} />
      <Tabs.Screen
        name="llogaria"
        options={{ title: t("tabs.profili"), tabBarIcon: ikonaETabit(ikonat.personi) }}
      />
    </Tabs>
  );
}
