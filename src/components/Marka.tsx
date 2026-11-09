import { StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";

// Emri i revistës: "TrimTime" me serif të zi dhe pikë të kuqe, si titulli i një reviste.
export default function Marka({ madhesia = 30 }: { madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.marka} accessibilityRole="header" accessibilityLabel="TrimTime">
      <Text style={[styles.emri, { color: ngjyrat.teksti, fontSize: madhesia, lineHeight: madhesia * 1.15 }]}>
        TrimTime
        <Text style={{ color: ngjyrat.theksi }}>.</Text>
      </Text>
    </View>
  );
}

// Vija e trashë sipër dhe e hollë poshtë, si koka e faqes së një reviste.
// (Emri mbetet "Drita" që ekranet ekzistuese të mos ndryshojnë.)
export function Drita({ lartesia: _lartesia }: { lartesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View style={styles.koka} pointerEvents="none">
      <View style={[styles.vijaETrashe, { backgroundColor: ngjyrat.vija }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  marka: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  emri: {
    fontFamily: shkronjat.titull,
    letterSpacing: -0.8,
  },
  koka: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  vijaETrashe: {
    height: 4,
  },
});
