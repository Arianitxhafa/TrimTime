import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useZhvendosTerminin } from "../../api/biznesi";
import { useLokaliIm } from "../../api/lokalet";
import { useStafi } from "../../api/stafi";
import { mesazhiIGabimitTeRezervimit, useOraretELira, useTerminetELokalit } from "../../api/terminet";
import Butoni from "../../components/Butoni";
import { GabimiIFormes } from "../../components/KornizaAuth";
import RrjetaEOrareve from "../../components/RrjetaEOrareve";
import ZgjedhesiIDites from "../../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../../context/TemaContext";
import { ditetEArdhshme } from "../../lib/datat";
import type { AnetariIStafit, OraELire, TerminiILokalit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function ZhvendosTerminin() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { id, data } = useLocalSearchParams<{ id: string; data: string }>();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const terminet = useTerminetELokalit(lokaliId, data);
  const stafi = useStafi(lokaliId);
  const termini = terminet.data?.find((x) => x.id === id);

  if (!lokaliId || !termini || !stafi.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Zgjedhja lokaliId={lokaliId} termini={termini} berberet={stafi.data.filter((a) => a.aktiv)} dataEMeParshme={data} />;
}

type Props = {
  lokaliId: string;
  termini: TerminiILokalit;
  berberet: AnetariIStafit[];
  dataEMeParshme: string;
};

function Zgjedhja({ lokaliId, termini, berberet, dataEMeParshme }: Props) {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const zhvendos = useZhvendosTerminin();
  const ditet = useMemo(() => ditetEArdhshme(30), []);
  const [berberiId, setBerberiId] = useState(termini.berberi_id);
  const [data, setData] = useState(ditet.includes(dataEMeParshme) ? dataEMeParshme : ditet[0]);
  const [ora, setOra] = useState<OraELire | null>(null);

  const oraret = useOraretELira({
    lokaliId,
    sherbimiId: termini.sherbimi_id,
    data,
    berberiId,
    perjashtoTerminin: termini.id,
    perStafin: true,
  });

  function ruaj() {
    if (!ora) return;
    zhvendos.mutate(
      { terminiId: termini.id, fillonMe: ora.fillon_me, berberiId },
      // Kthehet te kalendari ose te Sot, sepse termini mund të ketë ndryshuar ditë.
      { onSuccess: () => router.dismiss(2), onError: () => setOra(null) },
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.permbajtja}>
        <Text style={styles.teksti}>{t("zhvendos.teksti", { klienti: termini.klienti_emri })}</Text>

        <Text style={styles.etiketa}>{t("rezervimi.berberi")}</Text>
        <View style={styles.berberet}>
          {berberet.map((b) => {
            const aktiv = b.profili_id === berberiId;
            return (
              <Pressable
                key={b.profili_id}
                accessibilityRole="radio"
                accessibilityState={{ selected: aktiv }}
                onPress={() => {
                  setBerberiId(b.profili_id);
                  setOra(null);
                }}
                style={[styles.chip, aktiv && styles.chipAktiv]}
              >
                <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{b.emri.split(" ")[0] || "—"}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiketa}>{t("rezervimi.dita")}</Text>
        <ZgjedhesiIDites
          ditet={ditet}
          zgjedhur={data}
          onZgjidh={(d) => {
            setData(d);
            setOra(null);
          }}
        />

        <Text style={styles.etiketa}>{t("rezervimi.ora")}</Text>
        <RrjetaEOrareve oraret={oraret.data} ngarkohet={oraret.isFetching} zgjedhur={ora?.fillon_me ?? null} onZgjidh={setOra} />

        {zhvendos.isError && (
          <View style={styles.gabimi}>
            <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(zhvendos.error, t)} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("zhvendos.ruaj")} joAktiv={!ora} ngarkohet={zhvendos.isPending} onPress={ruaj} />
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
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.xl,
      marginBottom: hapesira.md,
    },
    berberet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    chip: {
      paddingHorizontal: 16,
      height: 38,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    chipTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    gabimi: {
      marginTop: hapesira.lg,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
