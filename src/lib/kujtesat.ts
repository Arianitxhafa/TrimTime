import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import type { TFunction } from "i18next";
import { Platform } from "react-native";
import type { TerminiIKlientit } from "./tipet";

// Kujtesa lokale në telefon: 24 orë dhe 2 orë para terminit. Nuk kërkojnë server,
// prandaj punojnë edhe në Expo Go.

const KANALI = "kujtesat";
const PARASHTESA = "trimtime.kujtesat.";
const ORET_PARA = [24, 2];

type KujtesatERuajtura = { fillon_me: string; idte: string[] };

// Mjaftojnë këto fusha, që kujtesat të planifikohen menjëherë pas rezervimit.
export type TerminiPerKujtese = Pick<
  TerminiIKlientit,
  "id" | "fillon_me" | "ora_lokale" | "lokali_emri" | "sherbimi_emri" | "statusi"
>;

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function kaLeje(kerkoNeseMungon: boolean): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const leja = await Notifications.getPermissionsAsync();
  if (leja.granted) return true;
  if (!kerkoNeseMungon || !leja.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function anuloTeRuajturat(terminiId: string) {
  const teRuajtura = await AsyncStorage.getItem(PARASHTESA + terminiId);
  if (!teRuajtura) return;
  const { idte } = JSON.parse(teRuajtura) as KujtesatERuajtura;
  await Promise.all(idte.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await AsyncStorage.removeItem(PARASHTESA + terminiId);
}

async function planifiko(termini: TerminiPerKujtese, t: TFunction) {
  await Notifications.setNotificationChannelAsync(KANALI, {
    name: t("kujtesat.kanali"),
    // AndroidImportance eksportohet si enum i kompiluar, që eslint-plugin-import nuk e njeh.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
  });

  const fillimi = new Date(termini.fillon_me).getTime();
  const idte: string[] = [];
  for (const oret of ORET_PARA) {
    const kur = fillimi - oret * 3_600_000;
    if (kur <= Date.now() + 60_000) continue;
    idte.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(oret === 24 ? "kujtesat.titulliNeser" : "kujtesat.titulliSot", {
            sherbimi: termini.sherbimi_emri,
          }),
          body: t("kujtesat.teksti", { ora: termini.ora_lokale, lokali: termini.lokali_emri }),
          data: { terminiId: termini.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(kur), channelId: KANALI },
      }),
    );
  }
  const teRuajtura: KujtesatERuajtura = { fillon_me: termini.fillon_me, idte };
  await AsyncStorage.setItem(PARASHTESA + termini.id, JSON.stringify(teRuajtura));
}

// Thirret pas rezervimit: kërkon lejen e njoftimeve vetëm në këtë moment, kur ka kuptim.
export async function planifikoKujtesat(termini: TerminiPerKujtese, t: TFunction) {
  try {
    if (!(await kaLeje(true))) return;
    await anuloTeRuajturat(termini.id);
    await planifiko(termini, t);
  } catch {
    // Kujtesat janë ndihmë, jo pjesë e domosdoshme e rezervimit.
  }
}

export async function anuloKujtesat(terminiId: string) {
  if (Platform.OS === "web") return;
  await anuloTeRuajturat(terminiId).catch(() => {});
}

// Përputh kujtesat me terminet aktuale: shton për terminet e reja ose të zhvendosura
// (edhe nga lokali) dhe heq për ato të anuluara. Nuk e kërkon lejen vetë.
export async function sinkronizoKujtesat(terminet: TerminiPerKujtese[], t: TFunction) {
  try {
    if (!(await kaLeje(false))) return;
    for (const termini of terminet) {
      const aktiv = termini.statusi === "ne_pritje" || termini.statusi === "konfirmuar";
      const teRuajtura = await AsyncStorage.getItem(PARASHTESA + termini.id);
      const fillon = teRuajtura ? (JSON.parse(teRuajtura) as KujtesatERuajtura).fillon_me : null;

      if (!aktiv || new Date(termini.fillon_me).getTime() < Date.now()) {
        if (teRuajtura) await anuloTeRuajturat(termini.id);
      } else if (fillon !== termini.fillon_me) {
        await anuloTeRuajturat(termini.id);
        await planifiko(termini, t);
      }
    }
  } catch {
    // Shih planifikoKujtesat.
  }
}
