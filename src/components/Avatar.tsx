import { StyleSheet, Text, View } from "react-native";
import { useTema } from "../context/TemaContext";
import { shkronjat } from "../theme";

function inicialet(emri: string): string {
  return emri
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// Inicialet me serif brenda një rrethi me kornizë boje, si monogram.
export default function Avatar({ emri, madhesia = 44 }: { emri: string; madhesia?: number }) {
  const { ngjyrat } = useTema();
  return (
    <View
      style={[
        styles.rrethi,
        {
          width: madhesia,
          height: madhesia,
          borderRadius: madhesia / 2,
          backgroundColor: ngjyrat.siperfaqja2,
          borderColor: ngjyrat.vija,
        },
      ]}
    >
      <Text style={[styles.teksti, { color: ngjyrat.teksti, fontSize: madhesia * 0.4 }]}>{inicialet(emri)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rrethi: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  teksti: {
    ...shkronjat.titullBold,
  },
});
