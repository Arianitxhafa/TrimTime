import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

export type EmriIkones = { ios: SFSymbol; android: AndroidSymbol };

type Props = {
  emri: EmriIkones;
  madhesia?: number;
  ngjyra: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export default function Ikona({ emri, madhesia = 20, ngjyra, style }: Props) {
  return (
    <SymbolView
      name={{ ios: emri.ios, android: emri.android, web: emri.android }}
      size={madhesia}
      tintColor={ngjyra}
      style={style}
    />
  );
}

export const ikonat = {
  kalendar: { ios: "calendar", android: "calendar_month" },
  gershere: { ios: "scissors", android: "content_cut" },
  ora: { ios: "clock", android: "schedule" },
  kerko: { ios: "magnifyingglass", android: "search" },
  shto: { ios: "plus", android: "add" },
  fshi: { ios: "trash", android: "delete" },
  djathtas: { ios: "chevron.right", android: "chevron_right" },
  majtas: { ios: "chevron.left", android: "chevron_left" },
  yll: { ios: "star.fill", android: "star" },
  grafik: { ios: "chart.bar.fill", android: "bar_chart" },
  zhvendos: { ios: "arrow.left.arrow.right", android: "swap_horiz" },
  mbyll: { ios: "xmark", android: "close" },
  pastro: { ios: "xmark.circle.fill", android: "cancel" },
  kthe: { ios: "arrow.uturn.backward", android: "undo" },
  konfirmo: { ios: "checkmark", android: "check" },
  perfundo: { ios: "checkmark.seal.fill", android: "task_alt" },
  anulo: { ios: "calendar.badge.exclamationmark", android: "event_busy" },
  telefoni: { ios: "phone.fill", android: "call" },
  shenime: { ios: "note.text", android: "notes" },
  cmimi: { ios: "eurosign.circle", android: "euro" },
  kohezgjatja: { ios: "hourglass", android: "timer" },
  bosh: { ios: "tray", android: "inbox" },
  personi: { ios: "person.fill", android: "person" },
  cilesimet: { ios: "gearshape.fill", android: "settings" },
  dielli: { ios: "sun.max.fill", android: "light_mode" },
  hena: { ios: "moon.fill", android: "dark_mode" },
  pajisja: { ios: "iphone", android: "smartphone" },
  gjuha: { ios: "globe", android: "language" },
  zbulo: { ios: "sparkles", android: "explore" },
  harta: { ios: "map.fill", android: "map" },
  sot: { ios: "list.bullet.rectangle.fill", android: "today" },
  klientet: { ios: "person.2.fill", android: "group" },
  lokali: { ios: "storefront.fill", android: "storefront" },
  email: { ios: "envelope.fill", android: "mail" },
  dryni: { ios: "lock.fill", android: "lock" },
  syri: { ios: "eye", android: "visibility" },
  syriMbyllur: { ios: "eye.slash", android: "visibility_off" },
  dil: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  gabim: { ios: "exclamationmark.triangle.fill", android: "warning" },
  kesh: { ios: "banknote.fill", android: "payments" },
  karte: { ios: "creditcard.fill", android: "credit_card" },
  dhurate: { ios: "gift.fill", android: "redeem" },
  etiketa: { ios: "tag.fill", android: "sell" },
  zile: { ios: "bell.fill", android: "notifications" },
  pergjigju: { ios: "arrowshape.turn.up.left.fill", android: "reply" },
} satisfies Record<string, EmriIkones>;
