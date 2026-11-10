import * as Calendar from "expo-calendar";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

export type NgjarjaEKalendarit = {
  titulli: string;
  fillon: Date;
  mbaron: Date;
  vendi?: string;
  shenime?: string;
};

export type RezultatiIKalendarit = "u_ruajt" | "u_anulua" | "u_hap_jashte";

// 20261110T143000Z: formati i datave në lidhjet e Google Calendar.
function dataGoogle(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function lidhjaGoogle(n: NgjarjaEKalendarit): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: n.titulli,
    dates: `${dataGoogle(n.fillon)}/${dataGoogle(n.mbaron)}`,
    ...(n.vendi ? { location: n.vendi } : {}),
    ...(n.shenime ? { details: n.shenime } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Hap dritaren e sistemit "Shto ngjarje" me terminin të plotësuar dhe kujtesë 1 orë më parë.
// Në Expo Go dhe në web moduli i kalendarit nuk ekziston: atëherë hapet Google Calendar.
export async function shtoNeKalendar(n: NgjarjaEKalendarit): Promise<RezultatiIKalendarit> {
  if (Platform.OS !== "web") {
    try {
      if (Platform.OS === "ios") await Calendar.requestCalendarPermissions(true);
      let kalendari: Calendar.ExpoCalendar | undefined;
      try {
        kalendari = Calendar.getDefaultCalendarSync();
      } catch {
        kalendari = (await Calendar.getCalendars(Calendar.EntityTypes.EVENT))[0];
      }
      if (kalendari) {
        const rezultati = await kalendari.addEventWithForm({
          title: n.titulli,
          startDate: n.fillon,
          endDate: n.mbaron,
          location: n.vendi,
          notes: n.shenime,
          alarms: [{ relativeOffset: -60 }],
        });
        return rezultati.action === "canceled" ? "u_anulua" : "u_ruajt";
      }
    } catch {
      // Expo Go ose leje e refuzuar: vazhdohet me Google Calendar.
    }
  }
  await Linking.openURL(lidhjaGoogle(n));
  return "u_hap_jashte";
}
