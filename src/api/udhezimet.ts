import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Linking, Platform } from "react-native";
import type { Koordinata } from "../lib/tipet";

// Lidhjet për navigimin deri te lokali. Google Maps hapet si aplikacion kur është i instaluar
// (lidhje universale), përndryshe në shfletues.
export function lidhjaEAppleMaps(k: Koordinata): string {
  return `https://maps.apple.com/?daddr=${k.lat},${k.lng}&dirflg=d`;
}

export function lidhjaEGoogleMaps(k: Koordinata): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${k.lat},${k.lng}`;
}

// "Udhëzimet": aplikacioni nuk ka hartë brenda. Në iPhone klienti zgjedh Apple Maps ose Google Maps;
// në Android hapet Google Maps direkt.
export function useHapUdhezimet() {
  const { t } = useTranslation();
  return (lokali: Koordinata) => {
    if (Platform.OS !== "ios") {
      void Linking.openURL(lidhjaEGoogleMaps(lokali));
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t("udhezimet.hapMe"),
        options: ["Apple Maps", "Google Maps", t("pergjithshme.anulo")],
        cancelButtonIndex: 2,
      },
      (i) => {
        if (i === 0) void Linking.openURL(lidhjaEAppleMaps(lokali));
        else if (i === 1) void Linking.openURL(lidhjaEGoogleMaps(lokali));
      },
    );
  };
}
