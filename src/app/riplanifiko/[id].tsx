import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  mesazhiIGabimitTeRezervimit,
  useOraretELira,
  useRiplanifikoTerminin,
  useTerminetEMia,
} from "../../api/terminet";
import Butoni from "../../components/Butoni";
import { GabimiIFormes } from "../../components/KornizaAuth";
import RrjetaEOrareve from "../../components/RrjetaEOrareve";
import ZgjedhesiIDites from "../../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../../context/TemaContext";
import { ditetEArdhshme, formatoDaten } from "../../lib/datat";
import { planifikoKujtesat } from "../../lib/kujtesat";
import type { OraELire, TerminiIKlientit } from "../../lib/tipet";
import { hapesira, type Ngjyrat } from "../../theme";

export default function Riplanifiko() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { id } = useLocalSearchParams<{ id: string }>();
  const terminet = useTerminetEMia();
  const termini = terminet.data?.find((x) => x.id === id);

  if (!termini) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Zgjedhja termini={termini} />;
}

function Zgjedhja({ termini }: { termini: TerminiIKlientit }) {
  const { t } = useTranslation();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const riplanifiko = useRiplanifikoTerminin();
  const ditet = useMemo(() => ditetEArdhshme(14), []);
  const [data, setData] = useState(ditet.includes(termini.data_lokale) ? termini.data_lokale : ditet[0]);
  const [ora, setOra] = useState<OraELire | null>(null);

  // I njëjti berber; termini që po zhvendoset nuk e bllokon orën e vet.
  const oraret = useOraretELira({
    lokaliId: termini.lokali_id,
    sherbimiId: termini.sherbimi_id,
    data,
    berberiId: termini.berberi_id,
    perjashtoTerminin: termini.id,
  });

  function ruaj() {
    if (!ora) return;
    riplanifiko.mutate(
      { terminiId: termini.id, fillonMe: ora.fillon_me },
      {
        onSuccess: () => {
          planifikoKujtesat({ ...termini, fillon_me: ora.fillon_me, ora_lokale: ora.ora }, t);
          router.back();
        },
        onError: () => setOra(null),
      },
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.permbajtja}>
        <Text style={styles.teksti}>
          {t("terminetEMia.ndryshoTeksti", {
            berberi: termini.berberi_emri.split(" ")[0],
            sherbimi: termini.sherbimi_emri,
          })}
        </Text>
        <Text style={styles.aktuali}>
          {formatoDaten(termini.data_lokale, t)} · {termini.ora_lokale} → {ora ? `${formatoDaten(data, t)} · ${ora.ora}` : "…"}
        </Text>

        <ZgjedhesiIDites
          ditet={ditet}
          zgjedhur={data}
          onZgjidh={(d) => {
            setData(d);
            setOra(null);
          }}
        />
        <View style={styles.oraret}>
          <RrjetaEOrareve
            oraret={oraret.data}
            ngarkohet={oraret.isFetching}
            zgjedhur={ora?.fillon_me ?? null}
            onZgjidh={setOra}
          />
        </View>

        {riplanifiko.isError && <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(riplanifiko.error, t)} />}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni
          titulli={t("terminetEMia.ruajOren")}
          joAktiv={!ora}
          ngarkohet={riplanifiko.isPending}
          onPress={ruaj}
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
    teksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
    },
    aktuali: {
      color: ngjyrat.ari,
      fontSize: 15,
      fontWeight: "800",
      marginTop: hapesira.sm,
      marginBottom: hapesira.xl,
    },
    oraret: {
      marginTop: hapesira.xl,
      marginBottom: hapesira.lg,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
