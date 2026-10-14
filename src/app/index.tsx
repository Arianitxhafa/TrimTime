import { ScrollView, StyleSheet, Text } from "react-native";
import KartaTerminit from "../components/KartaTerminit";

export default function Index() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BarberBook</Text>
      <Text style={styles.subtitle}>Terminet e sotme</Text>

      <KartaTerminit
        klienti="Ardi Krasniqi"
        sherbimi="Prerje klasike"
        ora="10:00"
        statusi="Konfirmuar"
      />

      <KartaTerminit
        klienti="Luan Berisha"
        sherbimi="Prerje dhe mjekër"
        ora="11:30"
        statusi="Në pritje"
      />

      <KartaTerminit
        klienti="Dion Gashi"
        sherbimi="Rregullim i mjekrës"
        ora="13:00"
        statusi="Përfunduar"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#111111",
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
});
