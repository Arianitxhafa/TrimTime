
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type Props = {
  klienti: string;
  sherbimi: string;
  ora: string;
  statusi: "Në pritje" | "Konfirmuar" | "Përfunduar";
};

export default function KartaTerminit({
  klienti,
  sherbimi,
  ora,
  statusi,
}: Props) {
  const [statusiAktual, setStatusiAktual] = useState(statusi);

  return (
    <View style={styles.card}>
      <Text style={styles.klienti}>{klienti}</Text>

      <Text style={styles.info}>Shërbimi: {sherbimi}</Text>
      <Text style={styles.info}>Ora: {ora}</Text>

      <Text style={styles.status}>
        Statusi: {statusiAktual}
      </Text>

      {statusiAktual === "Në pritje" && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setStatusiAktual("Konfirmuar")}
        >
          <Text style={styles.buttonText}>
            Konfirmo terminin
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#202020",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
  },
  klienti: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  info: {
    color: "#D1D1D1",
    fontSize: 14,
    marginBottom: 5,
  },
  status: {
    color: "#F0B35A",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#F0B35A",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#111111",
    fontWeight: "bold",
    fontSize: 14,
  },
});

