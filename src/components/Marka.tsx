import { useId } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Emri i aplikacionit si tabelë berberie: gërshërë prej bronzi dhe "TrimTime" me serif klasik.
export default function Marka({ madhesia = 30 }: { madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.marka} accessibilityRole="header" accessibilityLabel="TrimTime">
      <Ikona emri={ikonat.gershere} madhesia={Math.round(madhesia * 0.62)} ngjyra={ngjyrat.bronzi} />
      <Text style={[styles.emri, { color: ngjyrat.teksti, fontSize: madhesia, lineHeight: madhesia * 1.2 }]}>
        TrimTime
      </Text>
    </View>
  );
}

// Shiriti diagonal i berberit (e kuqe, krem, blu), si shtylla që rrotullohet te dera e berberisë.
export function ShiritiBerberit({ lartesia = 6, gjeresiaEVijes = 9 }: { lartesia?: number; gjeresiaEVijes?: number }) {
  const { ngjyrat } = useTema();
  const id = `shiriti-${useId().replace(/:/g, "")}`;
  const hapi = gjeresiaEVijes * 4;
  return (
    <View style={{ height: lartesia, overflow: "hidden" }} accessible={false} pointerEvents="none">
      <Svg width="100%" height={lartesia}>
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={hapi} height={hapi} patternTransform="rotate(-45)">
            <Rect x={0} y={0} width={gjeresiaEVijes} height={hapi} fill={ngjyrat.shiriti[0]} />
            <Rect x={gjeresiaEVijes} y={0} width={gjeresiaEVijes} height={hapi} fill={ngjyrat.shiriti[1]} />
            <Rect x={gjeresiaEVijes * 2} y={0} width={gjeresiaEVijes} height={hapi} fill={ngjyrat.shiriti[2]} />
            <Rect x={gjeresiaEVijes * 3} y={0} width={gjeresiaEVijes} height={hapi} fill={ngjyrat.shiriti[1]} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height={lartesia} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

// Shiriti i berberit në krye të ekranit. (Emri mbetet "Drita" që ekranet ekzistuese të mos ndryshojnë.)
export function Drita({ lartesia: _lartesia }: { lartesia?: number }) {
  return (
    <View style={styles.koka} pointerEvents="none">
      <ShiritiBerberit lartesia={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  marka: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emri: {
    fontFamily: shkronjat.titull,
    letterSpacing: -0.4,
  },
  koka: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
