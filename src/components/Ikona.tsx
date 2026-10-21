import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

export type EmriIkones = { ios: SFSymbol; android: AndroidSymbol };

type Props = {
  emri: EmriIkones;
  madhesia?: number;
  ngjyra: string;
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
} satisfies Record<string, EmriIkones>;
