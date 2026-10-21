import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { hapesira, ngjyrat, rrezja } from "../theme";
import Butoni from "./Butoni";

type Props = {
  iDukshem: boolean;
  titulli: string;
  mesazhi: string;
  tekstiKonfirmimit: string;
  rrezik?: boolean;
  onKonfirmo: () => void;
  onAnulo: () => void;
};

// Modal i personalizuar në vend të Alert, sepse Alert me butona nuk punon në web.
export default function DialogKonfirmimi({
  iDukshem,
  titulli,
  mesazhi,
  tekstiKonfirmimit,
  rrezik = false,
  onKonfirmo,
  onAnulo,
}: Props) {
  return (
    <Modal visible={iDukshem} transparent animationType="fade" onRequestClose={onAnulo}>
      <View style={styles.mbulesa}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onAnulo} accessibilityLabel="Mbyll" />
        <View style={styles.dialogu}>
          <Text style={styles.titulli}>{titulli}</Text>
          <Text style={styles.mesazhi}>{mesazhi}</Text>
          <View style={styles.butonat}>
            <Butoni titulli="Jo, kthehu" varianti="dytesor" onPress={onAnulo} style={styles.butoni} />
            <Butoni
              titulli={tekstiKonfirmimit}
              varianti={rrezik ? "rrezik" : "kryesor"}
              onPress={onKonfirmo}
              style={styles.butoni}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mbulesa: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: hapesira.xl,
  },
  dialogu: {
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.lg,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    padding: hapesira.xl,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  titulli: {
    color: ngjyrat.teksti,
    fontSize: 19,
    fontWeight: "800",
    marginBottom: hapesira.sm,
  },
  mesazhi: {
    color: ngjyrat.tekstiDyte,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: hapesira.xl,
  },
  butonat: {
    flexDirection: "row",
    gap: hapesira.md,
  },
  butoni: {
    flex: 1,
  },
});
