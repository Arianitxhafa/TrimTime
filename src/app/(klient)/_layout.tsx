import { useQueryClient } from "@tanstack/react-query";
import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";
import TabetWeb from "../../components/TabetWeb";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useListaEPritjesLive } from "../../api/listaEPritjes";
import { ikonat } from "../../components/Ikona";
import { useShporta } from "../../context/ShportaContext";
import { useTema } from "../../context/TemaContext";
import { formatoDaten } from "../../lib/datat";
import { njoftoOrenELire } from "../../lib/kujtesat";
import type { NeListenEPritjes } from "../../lib/tipet";

export default function KlientLayout() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const klienti = useQueryClient();
  const { numri } = useShporta();
  // Të gjitha tab-et kanë të njëjtën ngjyrë, atë të Studios: e zezë në dritë, e bardhë kockë në errësirë.

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
          { emri: "ballina", titulli: t("tabs.ballina"), ikona: ikonat.shtepia },
          { emri: "studio", titulli: t("tabs.rezervo"), ikona: ikonat.kalendar },
          { emri: "produkte", titulli: t("tabs.produkte"), ikona: ikonat.cante },
          { emri: "terminet-e-mia", titulli: t("tabs.terminet"), ikona: ikonat.kalendar },
          { emri: "profili", titulli: t("tabs.cilesimet"), ikona: ikonat.cilesimet },
        ]}
      />
    );
  }

  // Shiriti i tab-eve i iOS (Liquid Glass në iOS 26) dhe i Android-it, me ikonat SF Symbols.
  return (
    // Ngjyra vendoset te çdo tab (ikona + etiketa), që thjerrëza e Liquid Glass ta tregojë ngjyrën e
    // tab-it edhe kur gishti mbahet e zhvendoset mbi to; tintColor mbetet si rezervë.
    <NativeTabs
      tintColor={ngjyrat.ari}
      iconColor={ngjyrat.tekstiZbehte}
      minimizeBehavior="onScrollDown"
      backgroundColor={ngjyrat.siperfaqja}
    >
      <NativeTabs.Trigger name="ballina">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md={ikonat.shtepia.android} selectedColor={ngjyrat.ari} />
        <NativeTabs.Trigger.Label selectedStyle={{ color: ngjyrat.ari }}>{t("tabs.ballina")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="studio">
        <NativeTabs.Trigger.Icon sf="calendar.badge.plus" md={ikonat.kalendar.android} selectedColor={ngjyrat.ari} />
        <NativeTabs.Trigger.Label selectedStyle={{ color: ngjyrat.ari }}>{t("tabs.rezervo")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="produkte">
        <NativeTabs.Trigger.Icon sf={{ default: "bag", selected: "bag.fill" }} md={ikonat.cante.android} selectedColor={ngjyrat.ari} />
        <NativeTabs.Trigger.Label selectedStyle={{ color: ngjyrat.ari }}>{t("tabs.produkte")}</NativeTabs.Trigger.Label>
        {numri > 0 ? <NativeTabs.Trigger.Badge>{String(numri)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="terminet-e-mia">
        <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md={ikonat.ora.android} selectedColor={ngjyrat.ari} />
        <NativeTabs.Trigger.Label selectedStyle={{ color: ngjyrat.ari }}>{t("tabs.terminet")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profili">
        <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} md={ikonat.cilesimet.android} selectedColor={ngjyrat.ari} />
        <NativeTabs.Trigger.Label selectedStyle={{ color: ngjyrat.ari }}>{t("tabs.cilesimet")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
