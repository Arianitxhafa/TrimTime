import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useListaEPritjesLive } from "../../api/listaEPritjes";
import { ikonat } from "../../components/Ikona";
import { ikonaETabit, useOpsionetETabeve } from "../../components/opsionetETabeve";
import { formatoDaten } from "../../lib/datat";
import { njoftoOrenELire } from "../../lib/kujtesat";
import type { NeListenEPritjes } from "../../lib/tipet";

export default function KlientLayout() {
  const { t } = useTranslation();
  const opsionet = useOpsionetETabeve();
  const klienti = useQueryClient();

  // Një dëgjues i vetëm për listën e pritjes, i hapur sa kohë klienti është brenda.
  const kurLirohet = useCallback(
    (hyrja: { id: string; lokali_id: string; data: string }) => {
      const lista = klienti
        .getQueriesData<NeListenEPritjes[]>({ queryKey: ["lista-e-pritjes"] })
        .flatMap(([, te]) => te ?? []);
      const lokali = lista.find((h) => h.id === hyrja.id)?.lokali_emri ?? "TrimTime";
      njoftoOrenELire(
        t("listaEPritjes.njoftimiTitulli"),
        t("listaEPritjes.njoftimiTeksti", { lokali, data: formatoDaten(hyrja.data, t).toLowerCase() }),
        { lokaliId: hyrja.lokali_id, data: hyrja.data },
      );
    },
    [klienti, t],
  );
  useListaEPritjesLive(kurLirohet);

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
