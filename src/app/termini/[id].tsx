import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import KartaTerminit from "../../components/KartaTerminit";
import { terminet } from "../../data/terminet";

export default function DetajetTerminit() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const termini = terminet.find((item) => item.id === id);

  if (!termini) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Termini" }} />
        <Text style={styles.mesazhi}>Termini nuk u gjet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Detajet e terminit" }} />

      <Text style={styles.title}>Detajet e terminit</Text>

      <KartaTerminit
        klienti={termini.klienti}
        sherbimi={termini.sherbimi}
        ora={termini.ora}
        statusi={termini.statusi}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    color: "#F0B35A",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  mesazhi: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
