import { Link } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { terminet } from "../data/terminet";

export default function Index() {
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.lista}
      data={terminet}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>BarberBook</Text>
          <Text style={styles.subtitle}>Terminet e sotme</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Link
          href={
            {
              pathname: "/termini/[id]",
              params: { id: item.id },
            } as any
          }
          style={styles.rreshti}
        >
          <Text style={styles.klienti}>{item.klienti}</Text>

          <Text style={styles.info}>Shërbimi: {item.sherbimi}</Text>

          <Text style={styles.info}>Ora: {item.ora}</Text>

          <Text style={styles.status}>Statusi: {item.statusi}</Text>

          <Text style={styles.hap}>Shiko detajet →</Text>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  lista: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#F0B35A",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 24,
  },
  rreshti: {
    backgroundColor: "#202020",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    marginTop: 4,
  },
  hap: {
    color: "#F0B35A",
    marginTop: 12,
    fontWeight: "bold",
  },
});
