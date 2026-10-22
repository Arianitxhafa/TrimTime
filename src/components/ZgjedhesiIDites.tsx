import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useStilet } from "../context/TemaContext";
import { emriShkurterIDites, ngaISO } from "../lib/datat";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

type Props = {
  ditet: string[];
  zgjedhur: string;
  onZgjidh: (data: string) => void;
};

// Shiriti horizontal i ditëve: emri i shkurtër i ditës dhe numri.
export default function ZgjedhesiIDites({ ditet, zgjedhur, onZgjidh }: Props) {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.ditet}
    >
      {ditet.map((data, i) => {
        const aktiv = data === zgjedhur;
        return (
          <Pressable
            key={data}
            accessibilityRole="button"
            accessibilityState={{ selected: aktiv }}
            onPress={() => onZgjidh(data)}
            style={[styles.dita, aktiv && styles.ditaAktive]}
          >
            <Text style={[styles.emri, aktiv && styles.tekstiAktiv]}>
              {i === 0 ? t("koha.sot") : emriShkurterIDites(data, t)}
            </Text>
            <Text style={[styles.numri, aktiv && styles.tekstiAktiv]}>{ngaISO(data).getDate()}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    scroll: {
      marginHorizontal: -hapesira.xl,
    },
    ditet: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    dita: {
      width: 58,
      height: 70,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
    },
    ditaAktive: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    emri: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "700",
    },
    numri: {
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    tekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
  });
