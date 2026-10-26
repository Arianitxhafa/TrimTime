import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLokaliIm } from "../../api/lokalet";
import { useTerminetELokalit, useTerminetLiveILokalit } from "../../api/terminet";
import { ikonat } from "../../components/Ikona";
import { ikonaETabit, useOpsionetETabeve } from "../../components/opsionetETabeve";
import { useTema } from "../../context/TemaContext";
import { dataISO } from "../../lib/datat";

export default function BiznesLayout() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const opsionet = useOpsionetETabeve();

  // Rezervimet e sotme që presin konfirmim shfaqen si numër mbi tab-in Sot, në kohë reale.
  const lokaliId = useLokaliIm().data?.lokali.id;
  const terminetESotme = useTerminetELokalit(lokaliId, dataISO(new Date()));
  useTerminetLiveILokalit(lokaliId);
  const nePritje = (terminetESotme.data ?? []).filter((x) => x.statusi === "ne_pritje").length;

  return (
    <Tabs screenOptions={opsionet}>
      <Tabs.Screen
        name="sot"
        options={{
          title: t("tabs.sot"),
          tabBarIcon: ikonaETabit(ikonat.sot),
          tabBarBadge: nePritje > 0 ? nePritje : undefined,
          tabBarBadgeStyle: { backgroundColor: ngjyrat.ari, color: ngjyrat.mbiAri, fontWeight: "800" },
        }}
      />
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
