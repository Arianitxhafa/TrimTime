import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import {
  useFshiPushim,
  useOrariIBerberit,
  usePushimet,
  useRuajOrarinEBerberit,
  useShtoPushim,
  type OrariIBerberit,
} from "../../../api/biznesi";
import { useLokaliIm } from "../../../api/lokalet";
import { useOrari } from "../../../api/orari";
import { useStafi } from "../../../api/stafi";
import Butoni from "../../../components/Butoni";
import FushaTekstit from "../../../components/FushaTekstit";
import Ikona, { ikonat } from "../../../components/Ikona";
import { GabimiIFormes } from "../../../components/KornizaAuth";
import RedaktoriIOrarit, { orariEshteIVlefshem } from "../../../components/RedaktoriIOrarit";
import ZgjedhesiIDites from "../../../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../../../context/TemaContext";
import { dataISO, ditetEArdhshme, formatoDaten, ngaISO, shtoDite } from "../../../lib/datat";
import type { IntervaliIOrarit, Pushimi } from "../../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../../theme";

const ORET_E_PUSHIMIT = Array.from({ length: 31 }, (_, i) => {
  const minutat = 7 * 60 + i * 30; // 07:00 … 22:00
  return `${String(Math.floor(minutat / 60)).padStart(2, "0")}:${minutat % 60 === 0 ? "00" : "30"}`;
});

export default function EkraniIOraritTeBerberit() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { id } = useLocalSearchParams<{ id: string }>();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const orariIBerberit = useOrariIBerberit(lokaliId, id);
  const orariILokalit = useOrari(lokaliId);
  const stafi = useStafi(lokaliId);
  const berberi = stafi.data?.find((a) => a.profili_id === id);

  if (!lokaliId || !orariIBerberit.data || !orariILokalit.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      {berberi && <Stack.Screen options={{ title: berberi.emri }} />}
      <SeksioniIOrarit
        lokaliId={lokaliId}
        profiliId={id}
        fillestar={orariIBerberit.data}
        orariILokalit={orariILokalit.data}
      />
      <SeksioniIPushimeve lokaliId={lokaliId} profiliId={id} />
    </ScrollView>
  );
}

type SeksioniIOraritProps = {
  lokaliId: string;
  profiliId: string;
  fillestar: OrariIBerberit;
  orariILokalit: IntervaliIOrarit[];
};

function SeksioniIOrarit({ lokaliId, profiliId, fillestar, orariILokalit }: SeksioniIOraritProps) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ruaj = useRuajOrarinEBerberit(lokaliId, profiliId);
  const [orarIVecante, setOrarIVecante] = useState(fillestar.orarIVecante);
  // Orari i veçantë fillon nga orari i lokalit, që berberi të ndryshojë vetëm dallimet.
  const [oraret, setOraret] = useState(fillestar.orarIVecante ? fillestar.oraret : orariILokalit);

  return (
    <View style={styles.seksioni}>
      <View style={styles.rregulli}>
        <View style={styles.rregulliTeksti}>
          <Text style={styles.rregulliTitulli}>{t("berberi.orarIVecante")}</Text>
          <Text style={styles.rregulliPershkrimi}>{t("berberi.orarIVecanteTeksti")}</Text>
        </View>
        <Switch
          value={orarIVecante}
          onValueChange={setOrarIVecante}
          trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
          thumbColor="#FFFFFF"
          accessibilityLabel={t("berberi.orarIVecante")}
        />
      </View>

      {orarIVecante && <RedaktoriIOrarit oraret={oraret} onNdrysho={setOraret} />}

      <GabimiIFormes mesazhi={ruaj.isError ? t("pergjithshme.gabimPapritur") : null} />
      <Butoni
        titulli={t("berberi.ruaj")}
        joAktiv={orarIVecante && !orariEshteIVlefshem(oraret)}
        ngarkohet={ruaj.isPending}
        onPress={() => ruaj.mutate({ orarIVecante, oraret })}
      />
    </View>
  );
}

function SeksioniIPushimeve({ lokaliId, profiliId }: { lokaliId: string; profiliId: string }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ditet = useMemo(() => ditetEArdhshme(90), []);
  const [kufijt] = useState(() => ({ nga: new Date().toISOString(), deri: new Date(Date.now() + 365 * 86_400_000).toISOString() }));
  const pushimet = usePushimet(lokaliId, kufijt.nga, kufijt.deri, profiliId);
  const shto = useShtoPushim(lokaliId);
  const fshi = useFshiPushim();

  const [forma, setForma] = useState(false);
  const [nga, setNga] = useState(ditet[0]);
  const [deri, setDeri] = useState(ditet[0]);
  const [gjitheDiten, setGjitheDiten] = useState(true);
  const [oraNga, setOraNga] = useState("12:00");
  const [oraDeri, setOraDeri] = useState("14:00");
  const [arsyeja, setArsyeja] = useState("");

  const ditetEFundit = ditet.filter((d) => d >= nga);
  const fillon = gjitheDiten ? ngaISO(nga) : new Date(`${nga}T${oraNga}:00`);
  const mbaron = gjitheDiten ? ngaISO(shtoDite(deri, 1)) : new Date(`${nga}T${oraDeri}:00`);
  const iVlefshem = mbaron.getTime() > fillon.getTime();

  function ruajPushimin() {
    if (!iVlefshem) return;
    shto.mutate(
      {
        profili_id: profiliId,
        fillon_me: fillon.toISOString(),
        mbaron_me: mbaron.toISOString(),
        arsyeja: arsyeja.trim() || null,
      },
      {
        onSuccess: () => {
          setForma(false);
          setArsyeja("");
        },
      },
    );
  }

  return (
    <View style={styles.seksioni}>
      <Text style={styles.titulli}>{t("berberi.pushimet")}</Text>

      {(pushimet.data ?? []).length === 0 && !pushimet.isPending ? (
        <Text style={styles.paPushime}>{t("berberi.paPushime")}</Text>
      ) : (
        <View style={styles.grupi}>
          {(pushimet.data ?? []).map((p, i) => (
            <RreshtiIPushimit key={p.id} pushimi={p} meKufi={i > 0} onFshi={() => fshi.mutate(p.id)} />
          ))}
        </View>
      )}

      {forma ? (
        <View style={styles.forma}>
          <Text style={styles.etiketa}>{t("berberi.nga")}</Text>
          <ZgjedhesiIDites
            ditet={ditet}
            zgjedhur={nga}
            onZgjidh={(d) => {
              setNga(d);
              if (deri < d) setDeri(d);
            }}
          />

          <View style={styles.rregulli}>
            <Text style={[styles.rregulliTitulli, styles.flex]}>{t("berberi.gjitheDiten")}</Text>
            <Switch
              value={gjitheDiten}
              onValueChange={setGjitheDiten}
              trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
              thumbColor="#FFFFFF"
              accessibilityLabel={t("berberi.gjitheDiten")}
            />
          </View>

          {gjitheDiten ? (
            <>
              <Text style={styles.etiketa}>{t("berberi.deri")}</Text>
              <ZgjedhesiIDites ditet={ditetEFundit} zgjedhur={deri} onZgjidh={setDeri} />
            </>
          ) : (
            <>
              <Text style={styles.etiketa}>{t("berberi.oraFillimit")}</Text>
              <ZgjedhesiIOres oret={ORET_E_PUSHIMIT} zgjedhur={oraNga} onZgjidh={setOraNga} />
              <Text style={styles.etiketa}>{t("berberi.oraMbarimit")}</Text>
              <ZgjedhesiIOres oret={ORET_E_PUSHIMIT} zgjedhur={oraDeri} onZgjidh={setOraDeri} />
            </>
          )}

          <FushaTekstit
            etiketa={t("berberi.arsyeja")}
            value={arsyeja}
            onChangeText={setArsyeja}
            placeholder={t("berberi.arsyejaShembull")}
            maxLength={120}
            gabimi={!iVlefshem ? t("berberi.gabimPushimi") : null}
          />
          <GabimiIFormes mesazhi={shto.isError ? t("pergjithshme.gabimPapritur") : null} />
          <View style={styles.butonat}>
            <Butoni titulli={t("pergjithshme.anulo")} varianti="dytesor" onPress={() => setForma(false)} style={styles.flex} />
            <Butoni
              titulli={t("berberi.ruajPushimin")}
              joAktiv={!iVlefshem}
              ngarkohet={shto.isPending}
              onPress={ruajPushimin}
              style={styles.flex2}
            />
          </View>
        </View>
      ) : (
        <Butoni titulli={t("berberi.shtoPushim")} varianti="dytesor" ikona={ikonat.shto} onPress={() => setForma(true)} />
      )}
    </View>
  );
}

function RreshtiIPushimit({ pushimi, meKufi, onFshi }: { pushimi: Pushimi; meKufi: boolean; onFshi: () => void }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const fillon = new Date(pushimi.fillon_me);
  const mbaron = new Date(pushimi.mbaron_me);
  const ora = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const ditePlote = ora(fillon) === "00:00" && ora(mbaron) === "00:00";
  const dita1 = formatoDaten(dataISO(fillon), t);
  const teksti = ditePlote
    ? (() => {
        const eFundit = dataISO(new Date(mbaron.getTime() - 1));
        return eFundit === dataISO(fillon) ? dita1 : `${dita1} – ${formatoDaten(eFundit, t)}`;
      })()
    : `${dita1}, ${ora(fillon)}–${ora(mbaron)}`;

  return (
    <View style={[styles.pushimi, meKufi && styles.meKufi]}>
      <View style={styles.flex}>
        <Text style={styles.pushimiData}>{teksti}</Text>
        {pushimi.arsyeja ? <Text style={styles.pushimiArsyeja}>{pushimi.arsyeja}</Text> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t("sherbimet.fshi")} onPress={onFshi} hitSlop={10}>
        <Ikona emri={ikonat.fshi} madhesia={18} ngjyra={ngjyrat.rrezik} />
      </Pressable>
    </View>
  );
}

function ZgjedhesiIOres({ oret, zgjedhur, onZgjidh }: { oret: string[]; zgjedhur: string; onZgjidh: (o: string) => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oret}>
      {oret.map((o) => (
        <Pressable
          key={o}
          accessibilityRole="radio"
          accessibilityState={{ selected: o === zgjedhur }}
          onPress={() => onZgjidh(o)}
          style={[styles.ora, o === zgjedhur && styles.oraAktive]}
        >
          <Text style={[styles.oraTeksti, o === zgjedhur && styles.oraTekstiAktiv]}>{o}</Text>
        </Pressable>
      ))}
    </ScrollView>
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
      paddingBottom: hapesira.xxl,
      gap: hapesira.xxl,
    },
    seksioni: {
      gap: hapesira.md,
    },
    titulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    rregulli: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
    },
    rregulliTeksti: {
      flex: 1,
      gap: 2,
    },
    rregulliTitulli: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    rregulliPershkrimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    paPushime: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 14,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    meKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    pushimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    pushimiData: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    pushimiArsyeja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      marginTop: 2,
    },
    forma: {
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      overflow: "hidden",
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
    },
    oret: {
      gap: hapesira.sm,
    },
    ora: {
      paddingHorizontal: 12,
      height: 38,
      borderRadius: rrezja.sm,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja2,
      justifyContent: "center",
    },
    oraAktive: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    oraTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    oraTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    butonat: {
      flexDirection: "row",
      gap: hapesira.md,
    },
    flex: {
      flex: 1,
    },
    flex2: {
      flex: 2,
    },
  });
