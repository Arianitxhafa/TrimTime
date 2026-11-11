import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";
import TabetWeb from "../../components/TabetWeb";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useListaEPritjesLive } from "../../api/listaEPritjes";
import { ikonat } from "../../components/Ikona";
import { useTema } from "../../context/TemaContext";
import { formatoDaten } from "../../lib/datat";
import { njoftoOrenELire } from "../../lib/kujtesat";
import type { NeListenEPritjes } from "../../lib/tipet";

export default function KlientLayout() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const klienti = useQueryClient();
  // Çdo tab ka ngjyrën e vet kur zgjidhet: Zbulo jeshile, Harta portokalli, Terminet blu,
  // Profili vjollcë (fletët dhe ekranet që hapen sipër mbajnë ngjyrën e Zbulo).
  const shtegu = usePathname();
  const ngjyraETabit = shtegu.startsWith("/harta")
    ? ngjyrat.portokalli
    : shtegu.startsWith("/terminet-e-mia")
      ? ngjyrat.blu
      : shtegu.startsWith("/profili")
        ? ngjyrat.vjollce
        : ngjyrat.jeshile;

  // Një dëgjues i vetëm për listën e pritjes, i hapur sa kohë klienti është brenda.
  const kurLirohet = useCallback(
    (hyrja: { id: string; lokali_id: string; data: string }) => {
      const lista = klienti
        .getQueriesData<NeListenEPritjes[]>({ queryKey: ["lista-e-pritjes"] })
        .flatMap(([, te]) => te ?? []);
      const ePritur = lista.find((h) => h.id === hyrja.id);
      njoftoOrenELire(
        t("listaEPritjes.njoftimiTitulli"),
        t("listaEPritjes.njoftimiTeksti", {
          lokali: ePritur?.lokali_emri ?? "TrimTime",
          data: formatoDaten(hyrja.data, t).toLowerCase(),
        }),
        { lokaliId: hyrja.lokali_id, data: hyrja.data, sherbimiId: ePritur?.sherbimi_id },
      );
    },
    [klienti, t],
  );
  useListaEPritjesLive(kurLirohet);

  if (Platform.OS === "web") {
    return (
      <TabetWeb
        tabet={[
          { emri: "zbulo", titulli: t("tabs.zbulo"), ikona: ikonat.zbulo },
          { emri: "harta", titulli: t("tabs.harta"), ikona: ikonat.harta },
          { emri: "terminet-e-mia", titulli: t("tabs.terminet"), ikona: ikonat.kalendar },
          { emri: "profili", titulli: t("tabs.profili"), ikona: ikonat.personi },
        ]}
      />
    );
  }

  // Shiriti i tab-eve i iOS (Liquid Glass në iOS 26) dhe i Android-it, me ikonat SF Symbols.
  return (
    <NativeTabs tintColor={ngjyraETabit} minimizeBehavior="onScrollDown" backgroundColor={ngjyrat.siperfaqja}>
      <NativeTabs.Trigger name="zbulo">
        <NativeTabs.Trigger.Icon sf="sparkle.magnifyingglass" md={ikonat.zbulo.android} />
        <NativeTabs.Trigger.Label>{t("tabs.zbulo")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="harta">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md={ikonat.harta.android} />
        <NativeTabs.Trigger.Label>{t("tabs.harta")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="terminet-e-mia">
        <NativeTabs.Trigger.Icon sf="calendar" md={ikonat.kalendar.android} />
        <NativeTabs.Trigger.Label>{t("tabs.terminet")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profili">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md={ikonat.personi.android} />
        <NativeTabs.Trigger.Label>{t("tabs.profili")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
