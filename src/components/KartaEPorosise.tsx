import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, ZoomIn } from "react-native-reanimated";
import { useNdryshoStatusinEPorosise, type Porosia, type StatusiIPorosise } from "../api/dyqani";
import { useStilet, useTema } from "../context/TemaContext";
import { dataISO, formatoDaten } from "../lib/datat";
import { formatoCmimin } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Butoni from "./Butoni";

type Props = {
  porosia: Porosia;
  // Stafi sheh klientin dhe butonat Gati / U mor; klienti vetëm "Anulo" derisa porosia është e re.
  perStafin?: boolean;
  vonesa?: number;
};

// Karta e një porosie: numri, data, statusi, artikujt, totali dhe veprimet.
export default function KartaEPorosise({ porosia: p, perStafin = false, vonesa = 0 }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ndrysho = useNdryshoStatusinEPorosise();
  const krijuar = new Date(p.krijuar_me);
  const ngjyraEStatusit: Record<StatusiIPorosise, string> = {
    e_re: ngjyrat.theksi,
    gati: ngjyrat.jeshile,
    marre: ngjyrat.tekstiZbehte,
    anuluar: ngjyrat.rrezik,
  };

  function ne(statusi: StatusiIPorosise) {
    if (statusi === "anuluar") prekja.mesatare();
    else prekja.sukses();
    ndrysho.mutate({ id: p.id, statusi });
  }

  return (
    <Animated.View entering={FadeInDown.delay(vonesa).duration(380)} layout={LinearTransition} style={styles.karta}>
      <View style={styles.koka}>
        <View style={styles.kokaTeksti}>
          <Text style={styles.numri}>#{p.id.slice(0, 6).toUpperCase()}</Text>
          <Text style={styles.data}>
            {formatoDaten(dataISO(krijuar), t)} · {krijuar.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        <Animated.View
          key={p.statusi}
          entering={ZoomIn.springify()}
          style={[styles.statusi, { borderColor: ngjyraEStatusit[p.statusi] }]}
        >
          <View style={[styles.pika, { backgroundColor: ngjyraEStatusit[p.statusi] }]} />
          <Text style={styles.statusiTeksti}>{t(`dyqani.statusi_${p.statusi}`)}</Text>
        </Animated.View>
      </View>

      {perStafin && p.profilet ? (
        <Pressable
          accessibilityRole="link"
          disabled={!p.profilet.telefoni}
          onPress={() => void Linking.openURL(`tel:${p.profilet?.telefoni}`)}
        >
          <Text style={styles.klienti}>
            {p.profilet.emri || t("profili.perdorues")}
            {p.profilet.telefoni ? ` · ${p.profilet.telefoni}` : ""}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.artikujt}>
        {p.porosite_artikujt.map((a) => (
          <View key={a.id} style={styles.artikulli}>
            <Text style={styles.artikulliEmri} numberOfLines={1}>
              {a.sasia} × {a.emri}
            </Text>
            <Text style={styles.artikulliCmimi}>{formatoCmimin(a.cmimi_centa * a.sasia)}</Text>
          </View>
        ))}
      </View>
      {p.shenime ? <Text style={styles.shenime}>“{p.shenime}”</Text> : null}

      <View style={styles.totali}>
        <Text style={styles.totaliEtiketa}>{t("rezervimi.totali")}</Text>
        <Text style={styles.totaliVlera}>{formatoCmimin(p.totali_centa)}</Text>
      </View>

      {perStafin && (p.statusi === "e_re" || p.statusi === "gati") ? (
        <View style={styles.veprimet}>
          {p.statusi === "e_re" ? (
            <Butoni titulli={t("dyqani.shenoGati")} ngarkohet={ndrysho.isPending} onPress={() => ne("gati")} style={styles.veprimi} />
          ) : (
            <Butoni titulli={t("dyqani.shenoMarre")} ngarkohet={ndrysho.isPending} onPress={() => ne("marre")} style={styles.veprimi} />
          )}
          <Butoni titulli={t("dyqani.anulo")} varianti="rrezik" onPress={() => ne("anuluar")} style={styles.veprimi} />
        </View>
      ) : null}
      {!perStafin && p.statusi === "e_re" ? (
        <Butoni titulli={t("dyqani.anuloPorosine")} varianti="rrezik" ngarkohet={ndrysho.isPending} onPress={() => ne("anuluar")} />
      ) : null}
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    kokaTeksti: {
      flex: 1,
    },
    numri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 18,
      letterSpacing: 0.5,
    },
    data: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    statusi: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: rrezja.plote,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    pika: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusiTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    klienti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.ari,
      fontSize: 15,
    },
    artikujt: {
      gap: 6,
    },
    artikulli: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: hapesira.md,
    },
    artikulliEmri: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
    },
    artikulliCmimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
    },
    shenime: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontStyle: "italic",
    },
    totali: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
      paddingTop: hapesira.sm,
    },
    totaliEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
    totaliVlera: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 18,
    },
    veprimet: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    veprimi: {
      flex: 1,
      minHeight: 46,
    },
  });
