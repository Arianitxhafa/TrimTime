import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
import { useOrari, useRuajOrarin } from "../../api/orari";
import Butoni from "../../components/Butoni";
import { GabimiIFormes } from "../../components/KornizaAuth";
import RedaktoriIOrarit, { orariEshteIVlefshem } from "../../components/RedaktoriIOrarit";
import { useStilet, useTema } from "../../context/TemaContext";
import type { IntervaliIOrarit } from "../../lib/tipet";
import { hapesira, type Ngjyrat } from "../../theme";

export default function MenaxhoOrarin() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const orari = useOrari(lokaliId);

  if (!lokaliId || !orari.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  // Redaktori merr orarin vetëm pasi të jetë ngarkuar, si gjendje fillestare.
  return <Redaktori lokaliId={lokaliId} fillestar={orari.data} />;
}

function Redaktori({ lokaliId, fillestar }: { lokaliId: string; fillestar: IntervaliIOrarit[] }) {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const ruaj = useRuajOrarin(lokaliId);
  const [oraret, setOraret] = useState(fillestar);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.permbajtja}>
        {ruaj.isError && <GabimiIFormes mesazhi={t("pergjithshme.gabimPapritur")} />}
        <RedaktoriIOrarit oraret={oraret} onNdrysho={setOraret} />
      </ScrollView>
      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni
          titulli={t("orari.ruaj")}
          joAktiv={!orariEshteIVlefshem(oraret)}
          ngarkohet={ruaj.isPending}
          onPress={() => ruaj.mutate(oraret, { onSuccess: () => router.back() })}
        />
      </View>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    qendra: {
      alignItems: "center",
      justifyContent: "center",
    },
    permbajtja: {
      padding: hapesira.xl,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
