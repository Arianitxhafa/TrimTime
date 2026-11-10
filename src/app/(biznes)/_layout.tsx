import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";
import TabetWeb from "../../components/TabetWeb";
import { useTranslation } from "react-i18next";
import { useLokaliIm } from "../../api/lokalet";
import { useTerminetELokalit, useTerminetLiveILokalit } from "../../api/terminet";
import { ikonat } from "../../components/Ikona";
import { useTema } from "../../context/TemaContext";
import { dataISO } from "../../lib/datat";

export default function BiznesLayout() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();

  // Rezervimet e sotme që presin konfirmim shfaqen si numër mbi tab-in Sot, në kohë reale.
  const lokaliId = useLokaliIm().data?.lokali.id;
  const terminetESotme = useTerminetELokalit(lokaliId, dataISO(new Date()));
  useTerminetLiveILokalit(lokaliId);
  const nePritje = (terminetESotme.data ?? []).filter((x) => x.statusi === "ne_pritje").length;

  if (Platform.OS === "web") {
    return (
      <TabetWeb
        tabet={[
          { emri: "sot", titulli: t("tabs.sot"), ikona: ikonat.sot, numri: nePritje },
          { emri: "kalendari", titulli: t("tabs.kalendari"), ikona: ikonat.kalendar },
          { emri: "klientet", titulli: t("tabs.klientet"), ikona: ikonat.klientet },
          { emri: "lokali", titulli: t("tabs.lokali"), ikona: ikonat.lokali },
          { emri: "llogaria", titulli: t("tabs.profili"), ikona: ikonat.personi },
        ]}
      />
    );
  }

  return (
    <NativeTabs tintColor={ngjyrat.ari} backgroundColor={ngjyrat.siperfaqja} badgeBackgroundColor={ngjyrat.ari}>
      <NativeTabs.Trigger name="sot">
        <NativeTabs.Trigger.Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} md={ikonat.sot.android} />
        <NativeTabs.Trigger.Label>{t("tabs.sot")}</NativeTabs.Trigger.Label>
        {nePritje > 0 ? <NativeTabs.Trigger.Badge>{String(nePritje)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="kalendari">
        <NativeTabs.Trigger.Icon sf="calendar" md={ikonat.kalendar.android} />
        <NativeTabs.Trigger.Label>{t("tabs.kalendari")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="klientet">
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2.fill" }} md={ikonat.klientet.android} />
        <NativeTabs.Trigger.Label>{t("tabs.klientet")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lokali">
        <NativeTabs.Trigger.Icon sf={{ default: "storefront", selected: "storefront.fill" }} md={ikonat.lokali.android} />
        <NativeTabs.Trigger.Label>{t("tabs.lokali")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="llogaria">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md={ikonat.personi.android} />
        <NativeTabs.Trigger.Label>{t("tabs.profili")}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
