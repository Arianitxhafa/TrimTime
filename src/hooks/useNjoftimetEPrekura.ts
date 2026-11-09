import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

// Kur përdoruesi prek një njoftim (kujtesë ose "u lirua një orë"), hapet ekrani në `data.url`.
// Mbulon edhe rastin kur aplikacioni ishte i mbyllur dhe u hap nga njoftimi.
export function useNjoftimetEPrekura(aktiv: boolean) {
  useEffect(() => {
    if (!aktiv || Platform.OS === "web") return;
    let iGjalle = true;

    function hap(njoftimi: Notifications.Notification) {
      const url = njoftimi.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("/")) {
        router.push(url as Href);
        Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    }

    Notifications.getLastNotificationResponseAsync()
      .then((pergjigjja) => {
        if (iGjalle && pergjigjja?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          hap(pergjigjja.notification);
        }
      })
      .catch(() => {});

    const abonimi = Notifications.addNotificationResponseReceivedListener((pergjigjja) => {
      if (pergjigjja.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) hap(pergjigjja.notification);
    });

    return () => {
      iGjalle = false;
      abonimi.remove();
    };
  }, [aktiv]);
}
