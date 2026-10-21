import { StyleSheet, Text, View } from "react-native";

const paleta = ["#E8B04B", "#7C9CFF", "#3DD68C", "#F5A524", "#C084FC", "#38BDF8"];

function inicialet(emri: string): string {
  return emri
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Avatar({ emri, madhesia = 44 }: { emri: string; madhesia?: number }) {
  const indeksi = [...emri].reduce((shuma, c) => shuma + c.charCodeAt(0), 0) % paleta.length;
  const ngjyra = paleta[indeksi];

  return (
    <View
      style={[
        styles.rrethi,
        {
          width: madhesia,
          height: madhesia,
          borderRadius: madhesia / 2,
          backgroundColor: ngjyra + "22",
          borderColor: ngjyra + "55",
        },
      ]}
    >
      <Text style={[styles.teksti, { color: ngjyra, fontSize: madhesia * 0.38 }]}>
        {inicialet(emri)}
      </Text>
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
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
