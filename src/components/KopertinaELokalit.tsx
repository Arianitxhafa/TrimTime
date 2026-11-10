import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";
import { ShiritiBerberit } from "./Marka";

type Props = {
  emri: string;
  fotoUrl: string | null;
  style?: StyleProp<ViewStyle>;
  // Për kokën e profilit: hije më e fortë poshtë, që emri i bardhë të lexohet.
  meHije?: boolean;
};

// Inicialet e emrit ("Arti Style" → "AS", "Berberi Arti" → "A"), pa fjalët e përgjithshme si "berber" ose "lokal".
function inicialet(emri: string): string {
  const teZakonshme = /^(berber\p{L}*|barber\p{L}*|lokal\p{L}*|qethj\p{L}*|sallon\p{L}*|studio|shop|the|&)$/iu;
  const fjalet = emri
    .replace(/[^\p{L}\p{N}\s&]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const kryesoret = fjalet.filter((f) => !teZakonshme.test(f));
  const burimi = kryesoret.length > 0 ? kryesoret : fjalet;
  const shkronjat = burimi.length >= 2 ? burimi[0][0] + burimi[1][0] : (burimi[0] ?? "T").slice(0, 1);
  return shkronjat.toLocaleUpperCase("sq");
}

// I njëjti lokal merr gjithmonë të njëjtën ngjyrë tabele.
function indeksiINgjyres(emri: string, numri: number): number {
  let h = 0;
  for (const c of emri) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % numri;
}

// Kopertina e lokalit: fotoja kur ka, përndryshe një tabelë berberie e gjeneruar me inicialet e
// lokalit në një medaljon prej bronzi dhe shiritin e berberit sipër.
export default function KopertinaELokalit({ emri, fotoUrl, style, meHije = false }: Props) {
  const { ngjyrat } = useTema();

  if (fotoUrl) {
    return (
      <View style={[styles.baza, style]}>
        <Image source={{ uri: fotoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        {meHije && <LinearGradient colors={ngjyrat.hijaEFotos} style={styles.hija} />}
      </View>
    );
  }

  const sfondi = ngjyrat.tabelat[indeksiINgjyres(emri, ngjyrat.tabelat.length)];
  const bronzi = "#D5B47A";
  return (
    <View style={[styles.baza, { backgroundColor: sfondi }, style]} accessible={false}>
      <ShiritiBerberit lartesia={10} gjeresiaEVijes={8} />
      <View style={[styles.korniza, { borderColor: "rgba(213,180,122,0.45)" }]} />
      <View style={styles.qendra}>
        <View style={[styles.medaljoni, { borderColor: bronzi }]}>
          <Text style={[styles.inicialet, { color: bronzi }]} numberOfLines={1} adjustsFontSizeToFit>
            {inicialet(emri)}
          </Text>
        </View>
      </View>
      {meHije && <LinearGradient colors={ngjyrat.hijaEFotos} style={styles.hija} />}
    </View>
  );
}

const styles = StyleSheet.create({
  baza: {
    overflow: "hidden",
  },
  korniza: {
    position: "absolute",
    top: 18,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  qendra: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  medaljoni: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  inicialet: {
    fontFamily: shkronjat.kursiveBold,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  hija: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
});
