import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Shirit te hyrja/regjistrimi që tregon rolin e zgjedhur dhe lejon kthimin te zgjedhja.
export default function RoliIZgjedhur() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { modi } = usePreferencat();

  return (
    <View style={styles.shiriti}>
      <Ikona emri={modi === "biznes" ? ikonat.lokali : ikonat.gershere} madhesia={16} ngjyra={ngjyrat.ari} />
      <Text style={styles.teksti}>{modi === "biznes" ? t("roli.siBiznes") : t("roli.siKlient")}</Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/roli"))}
      >
        <Text style={styles.ndrysho}>{t("roli.ndrysho")}</Text>
      </Pressable>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    shiriti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.ariIErret,
      borderRadius: rrezja.md,
      paddingHorizontal: hapesira.md,
      paddingVertical: 10,
      marginBottom: hapesira.lg,
    },
    teksti: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "600",
    },
    ndrysho: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "800",
    },
  });
