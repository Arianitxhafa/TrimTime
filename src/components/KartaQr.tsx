import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useTema } from "../context/TemaContext";
import { hapesira, hijet, rrezja } from "../theme";

type Props = {
  vlera: string;
  titulli: string;
  nentitulli?: string;
  madhesia?: number;
};

// QR i zi mbi të bardhë (lexohet më mirë nga kamerat), në një kartë me kornizë ari.
export default function KartaQr({ vlera, titulli, nentitulli, madhesia = 220 }: Props) {
  const { ngjyrat } = useTema();
  return (
    <View style={[styles.karta, hijet.karte, { borderColor: ngjyrat.ari }]}>
      <View style={styles.qr}>
        <QRCode value={vlera} size={madhesia} color="#0B0B0F" backgroundColor="#FFFFFF" ecl="M" />
      </View>
      <Text style={styles.titulli} numberOfLines={2}>
        {titulli}
      </Text>
      {nentitulli ? <Text style={styles.nentitulli}>{nentitulli}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  karta: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: rrezja.lg + 4,
    borderWidth: 3,
    padding: hapesira.xl,
    gap: hapesira.md,
  },
  qr: {
    padding: hapesira.sm,
    backgroundColor: "#FFFFFF",
  },
  titulli: {
    color: "#0B0B0F",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: 260,
  },
  nentitulli: {
    color: "#5C5C68",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
