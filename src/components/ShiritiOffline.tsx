import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet } from "../context/TemaContext";
import { useEshteOnline } from "../lib/lidhja";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Shirit i palëvizshëm sipër kur telefoni s'ka internet: aplikacioni tregon të dhënat e ruajta,
// por rezervimi, porosia dhe ndryshimet presin derisa të kthehet lidhja.
export default function ShiritiOffline() {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const online = useEshteOnline();
  if (online) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[styles.shiriti, { paddingTop: insets.top + 4 }]}
    >
      <View style={styles.rreshti}>
        <Ikona emri={ikonat.gabim} madhesia={14} ngjyra="#FFFFFF" />
        <Text style={styles.teksti} numberOfLines={2}>
          {t("offline.shiriti")}
        </Text>
      </View>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    shiriti: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: ngjyrat.rrezik,
      paddingBottom: 6,
      paddingHorizontal: hapesira.lg,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    teksti: {
      ...shkronjat.etiketeBold,
      color: "#FFFFFF",
      fontSize: 13,
      textAlign: "center",
    },
  });
