import { Image } from "expo-image";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FotoEPortofolit } from "../lib/tipet";
import { hapesira, rrezja } from "../theme";
import Ikona, { ikonat } from "./Ikona";
import Xham from "./Xham";

type Props = {
  fotot: FotoEPortofolit[];
  // null: galeria e mbyllur.
  indeksi: number | null;
  onMbyll: () => void;
  // Vetëm për stafin: butoni i fshirjes poshtë.
  veprimi?: { teksti: string; onPress: (foto: FotoEPortofolit) => void };
};

// Fotot në ekran të plotë, me rrëshqitje majtas-djathtas dhe përshkrimin poshtë.
// Prindi i jep `key={indeksi}`, që galeria të hapet te fotoja e prekur.
export default function GaleriaEPlote({ fotot, indeksi, onMbyll, veprimi }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [aktuali, setAktuali] = useState(indeksi ?? 0);
  const foto = fotot[aktuali];

  return (
    <Modal visible={indeksi !== null} animationType="fade" onRequestClose={onMbyll} statusBarTranslucent>
      <View style={styles.sfondi}>
        <FlatList
          data={fotot}
          keyExtractor={(f) => f.id}
          horizontal
          pagingEnabled
          initialScrollIndex={indeksi ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setAktuali(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={{ uri: item.foto_url }} style={{ width, height }} contentFit="contain" transition={150} />
          )}
        />

        <Pressable
          accessibilityRole="button"
          onPress={onMbyll}
          hitSlop={10}
          style={[styles.mbyll, { top: insets.top + hapesira.md }]}
        >
          <Xham style={styles.mbyllXham}>
            <Ikona emri={ikonat.mbyll} madhesia={20} ngjyra="#FFFFFF" />
          </Xham>
        </Pressable>

        {foto && (foto.pershkrimi || veprimi) ? (
          <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.lg }]}>
            {foto.pershkrimi ? <Text style={styles.pershkrimi}>{foto.pershkrimi}</Text> : null}
            {veprimi ? (
              <Pressable accessibilityRole="button" onPress={() => veprimi.onPress(foto)} style={styles.veprimi}>
                <Ikona emri={ikonat.fshi} madhesia={16} ngjyra="#F04452" />
                <Text style={styles.veprimiTeksti}>{veprimi.teksti}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.numri, { top: insets.top + hapesira.lg + 6 }]} pointerEvents="none">
          {fotot.length > 1 ? `${aktuali + 1} / ${fotot.length}` : ""}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sfondi: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mbyll: {
    position: "absolute",
    right: hapesira.lg,
  },
  mbyllXham: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  numri: {
    position: "absolute",
    alignSelf: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
  },
  fundi: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: hapesira.xl,
    paddingTop: hapesira.xl,
    gap: hapesira.md,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  pershkrimi: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
  veprimi: {
    flexDirection: "row",
    alignItems: "center",
    gap: hapesira.sm,
    alignSelf: "flex-start",
    paddingHorizontal: hapesira.md,
    height: 38,
    borderRadius: rrezja.plote,
    backgroundColor: "rgba(240,68,82,0.15)",
  },
  veprimiTeksti: {
    color: "#F04452",
    fontSize: 14,
    fontWeight: "700",
  },
});
