import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ikona, { ikonat, type EmriIkones } from "../components/Ikona";
import { useStilet, useTema, type ZgjedhjaTemes } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

const opsionetETemes: { vlera: ZgjedhjaTemes; titulli: string; pershkrimi: string; ikona: EmriIkones }[] = [
  {
    vlera: "sistemi",
    titulli: "Sipas sistemit",
    pershkrimi: "Ndjek cilësimet e telefonit",
    ikona: ikonat.pajisja,
  },
  { vlera: "celet", titulli: "I çelët", pershkrimi: "Sfond i bardhë i ngrohtë", ikona: ikonat.dielli },
  { vlera: "erret", titulli: "I errët", pershkrimi: "Më i qetë për sytë natën", ikona: ikonat.hena },
];

export default function Cilesimet() {
  const { zgjedhja, ndryshoZgjedhjen, ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <Text style={styles.seksioni}>Pamja</Text>
      <View accessibilityRole="radiogroup" style={styles.grupi}>
        {opsionetETemes.map((opsioni, i) => {
          const aktiv = zgjedhja === opsioni.vlera;
          return (
            <Pressable
              key={opsioni.vlera}
              accessibilityRole="radio"
              accessibilityState={{ selected: aktiv }}
              onPress={() => ndryshoZgjedhjen(opsioni.vlera)}
              style={({ pressed }) => [
                styles.rreshti,
                i > 0 && styles.rreshtiMeKufi,
                pressed && styles.shtypur,
              ]}
            >
              <View style={[styles.ikona, aktiv && styles.ikonaAktive]}>
                <Ikona
                  emri={opsioni.ikona}
                  madhesia={18}
                  ngjyra={aktiv ? ngjyrat.mbiAri : ngjyrat.tekstiDyte}
                />
              </View>
              <View style={styles.teksti}>
                <Text style={styles.titulli}>{opsioni.titulli}</Text>
                <Text style={styles.pershkrimi}>{opsioni.pershkrimi}</Text>
              </View>
              <View style={[styles.radio, aktiv && styles.radioAktiv]}>
                {aktiv && <View style={styles.radioPika} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      padding: hapesira.xl,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    ikona: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    ikonaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    teksti: {
      flex: 1,
      gap: 2,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    pershkrimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: ngjyrat.tekstiZbehte,
      alignItems: "center",
      justifyContent: "center",
    },
    radioAktiv: {
      borderColor: ngjyrat.ari,
    },
    radioPika: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: ngjyrat.ari,
    },
  });
