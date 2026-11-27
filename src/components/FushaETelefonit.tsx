import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet, useTema } from "../context/TemaContext";
import { prekja } from "../lib/prekja";
import { PREFIKSET, type Prefiksi } from "../lib/telefoni";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  prefiksi: Prefiksi;
  onPrefiksi: (p: Prefiksi) => void;
  numri: string;
  onNumri: (numri: string) => void;
  gabimi?: string | null;
  onSubmitEditing?: () => void;
};

// Numri i telefonit me prefiksin e shtetit: butoni i prefiksit hap një fletë me shtetet, si te
// aplikacionet e berberive; numri shkruhet pa prefiks (p.sh. 048 169 820).
export default function FushaETelefonit({ prefiksi, onPrefiksi, numri, onNumri, gabimi, onSubmitEditing }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const [hapur, setHapur] = useState(false);
  const [fokus, setFokus] = useState(false);

  return (
    <View style={styles.fusha}>
      <Text style={styles.etiketa}>{t("auth.telefoni")}</Text>
      <View style={styles.rreshti}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.prefiksi")}
          onPress={() => {
            prekja.lehte();
            setHapur(true);
          }}
          style={[styles.kutia, styles.prefiksi]}
        >
          <View>
            <Text style={styles.prefiksiEtiketa}>{t("auth.prefiksi")}</Text>
            <Text style={styles.prefiksiVlera}>
              {prefiksi.kodi} +{prefiksi.prefiksi}
            </Text>
          </View>
          <Ikona emri={ikonat.poshte} madhesia={14} ngjyra={ngjyrat.tekstiDyte} />
        </Pressable>
        <View style={[styles.kutia, styles.numri, fokus && styles.kutiaFokus, gabimi ? styles.kutiaGabim : null]}>
          <TextInput
            value={numri}
            onChangeText={onNumri}
            placeholder="048 169 820"
            placeholderTextColor={ngjyrat.tekstiZbehte}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            accessibilityLabel={t("auth.telefoni")}
            returnKeyType="next"
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setFokus(true)}
            onBlur={() => setFokus(false)}
            style={styles.input}
          />
        </View>
      </View>
      {gabimi ? <Text style={styles.gabimi}>{gabimi}</Text> : null}

      <Modal visible={hapur} transparent animationType="slide" onRequestClose={() => setHapur(false)}>
        <Pressable style={styles.mbulesa} onPress={() => setHapur(false)} accessibilityLabel={t("pergjithshme.anulo")} />
        <View style={[styles.fleta, { paddingBottom: insets.bottom + hapesira.md }]}>
          <View style={styles.fletaKoka}>
            <Text style={styles.fletaTitulli}>{t("auth.prefiksi")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("pergjithshme.anulo")}
              onPress={() => setHapur(false)}
              hitSlop={10}
              style={styles.mbyll}
            >
              <Ikona emri={ikonat.mbyll} madhesia={16} ngjyra={ngjyrat.teksti} />
            </Pressable>
          </View>
          <FlatList
            data={PREFIKSET}
            keyExtractor={(p) => p.kodi}
            contentContainerStyle={styles.lista}
            renderItem={({ item, index }) => {
              const aktiv = item.kodi === prefiksi.kodi;
              return (
                <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(280)}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: aktiv }}
                    onPress={() => {
                      prekja.zgjedhje();
                      onPrefiksi(item);
                      setHapur(false);
                    }}
                    style={[styles.opsioni, aktiv && styles.opsioniAktiv]}
                  >
                    <Text style={[styles.opsioniTeksti, aktiv && styles.opsioniTekstiAktiv]}>
                      {item.kodi} +{item.prefiksi}
                    </Text>
                    <Text style={[styles.opsioniShteti, aktiv && styles.opsioniTekstiAktiv]} numberOfLines={1}>
                      {item.shteti}
                    </Text>
                    {aktiv ? <Ikona emri={ikonat.konfirmo} madhesia={16} ngjyra={ngjyrat.mbiAri} /> : null}
                  </Pressable>
                </Animated.View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    fusha: {
      marginBottom: hapesira.lg,
    },
    etiketa: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
      marginBottom: hapesira.sm,
    },
    rreshti: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    kutia: {
      height: 58,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja2,
      paddingHorizontal: hapesira.lg,
      justifyContent: "center",
    },
    kutiaFokus: {
      borderColor: ngjyrat.ari,
    },
    kutiaGabim: {
      borderColor: ngjyrat.rrezik,
    },
    prefiksi: {
      width: 124,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    prefiksiEtiketa: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    prefiksiVlera: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    numri: {
      flex: 1,
    },
    input: {
      color: ngjyrat.teksti,
      fontSize: 18,
      height: 56,
      fontVariant: ["tabular-nums"],
    },
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 6,
    },
    mbulesa: {
      flex: 1,
      backgroundColor: ngjyrat.mbulesa,
    },
    fleta: {
      maxHeight: "72%",
      backgroundColor: ngjyrat.sfondi,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderCurve: "continuous",
      borderTopWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    fletaKoka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.xl,
      paddingBottom: hapesira.md,
    },
    fletaTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
    },
    mbyll: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    lista: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
      paddingBottom: hapesira.md,
    },
    opsioni: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      height: 58,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      paddingHorizontal: hapesira.lg,
    },
    opsioniAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    opsioniTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 17,
      width: 84,
    },
    opsioniShteti: {
      flex: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    opsioniTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
  });
