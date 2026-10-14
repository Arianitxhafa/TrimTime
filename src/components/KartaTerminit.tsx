import { StyleSheet, Text, View } from "react-native";

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
  return (
    <View style={styles.card}>
      <Text style={styles.klienti}>{klienti}</Text>
      <Text style={styles.info}>Shërbimi: {sherbimi}</Text>
      <Text style={styles.info}>Ora: {ora}</Text>
      <Text style={styles.status}>Statusi: {statusi}</Text>
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
});
