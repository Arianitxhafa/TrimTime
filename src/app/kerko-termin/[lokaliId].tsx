import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali } from "../../api/lokalet";
import { useOrari } from "../../api/orari";
import Butoni from "../../components/Butoni";
import EkraniINgarkimit from "../../components/EkraniINgarkimit";
import Ikona, { ikonat } from "../../components/Ikona";
import ZgjedhesiIDites from "../../components/ZgjedhesiIDites";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, ditetEArdhshme, formatoDaten, ngaISO } from "../../lib/datat";
import { prekja } from "../../lib/prekja";
import { eshteCelular, lidhjaEThirrjes, lidhjaSms, lidhjaWhatsApp, numriNderkombetar } from "../../lib/telefoni";
import type { IntervaliIOrarit } from "../../lib/tipet";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

const SHERBIMET = ["qethje", "mjeker", "teDyja"] as const;
type SherbimiIKerkuar = (typeof SHERBIMET)[number];

// Pa orarin e lokalit, ofrohen orët e zakonshme të një berberi.
const ORARI_I_ZAKONSHEM = { hapet: "08:00", mbyllet: "20:00" };
const HAPI_MIN = 30;

const neMinuta = (ora: string) => Number(ora.slice(0, 2)) * 60 + Number(ora.slice(3, 5));
const neOre = (minuta: number) =>
  `${String(Math.floor(minuta / 60)).padStart(2, "0")}:${String(minuta % 60).padStart(2, "0")}`;

// Orët që mund të kërkohen një ditë: çdo 30 minuta brenda orarit, pa ato që kanë kaluar sot.
// null: orari dihet dhe lokali është i mbyllur atë ditë.
function oretEDites(data: string, orari: IntervaliIOrarit[]): string[] | null {
  const dita = ngaISO(data).getDay();
  const intervalet = orari.length === 0 ? [ORARI_I_ZAKONSHEM] : orari.filter((o) => o.dita === dita);
  if (intervalet.length === 0) return null;

  const tani = new Date();
  const minimumi = data === dataISO(tani) ? tani.getHours() * 60 + tani.getMinutes() + HAPI_MIN : 0;
  const oret: string[] = [];
  for (const i of intervalet) {
    const fundi = neMinuta(i.mbyllet);
    for (let m = neMinuta(i.hapet); m + HAPI_MIN <= fundi; m += HAPI_MIN) {
      if (m >= minimumi) oret.push(neOre(m));
    }
  }
  return oret;
}

// Kërkesë për termin te një lokal që ende nuk përdor TrimTime (nga katalogu). Oraret e lira të tij
// nuk dihen, ndaj nuk premtohet asgjë: klienti zgjedh ditën dhe orën që do, dhe kërkesa i shkon
// berberit me WhatsApp, SMS ose thirrje. Berberi e konfirmon vetë.
export default function KerkoTermin() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { lokaliId } = useLocalSearchParams<{ lokaliId: string }>();
  const lokali = useLokali(lokaliId);
  const orari = useOrari(lokaliId);
  const { emriIShfaqur } = useAuth();

  const [ditet] = useState(() => ditetEArdhshme(14));
  const [data, setData] = useState(ditet[0]);
  const [ora, setOra] = useState<string | null>(null);
  const [sherbimi, setSherbimi] = useState<SherbimiIKerkuar>("qethje");
  const [uDergua, setUDergua] = useState(false);

  if (!lokali.data || !orari.isSuccess) {
    return <EkraniINgarkimit pyetjet={[lokali, orari]} mungon={lokali.isSuccess && !lokali.data} />;
  }

  const l = lokali.data;
  const numri = l.telefoni ? numriNderkombetar(l.telefoni) : null;
  const celular = numri !== null && eshteCelular(numri);
  const oret = oretEDites(data, orari.data);
  const kaOrar = orari.data.length > 0;

  const emri = emriIShfaqur.includes("@") ? "" : emriIShfaqur;
  const mesazhi = ora
    ? t("kerkoTermin.mesazhi", {
        sherbimi: t(`kerkoTermin.sherbimi_${sherbimi}`).toLowerCase(),
        dita: formatoDaten(data, t).toLowerCase(),
        data: `${ngaISO(data).getDate()}.${ngaISO(data).getMonth() + 1}`,
        ora,
      }) + (emri ? `\n${emri}` : "")
    : "";

  function hap(lidhja: string) {
    prekja.lehte();
    Linking.openURL(lidhja)
      .then(() => setUDergua(true))
      .catch(() => {
        // Pa WhatsApp ose pa aplikacion mesazhesh: mbetet thirrja.
        if (l.telefoni) void Linking.openURL(lidhjaEThirrjes(l.telefoni));
      });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 200 }]}
      >
        <Animated.View entering={FadeInDown.duration(320)}>
          <Text style={styles.emri}>{l.emri}</Text>
          <Text style={styles.adresa}>
            {l.adresa}, {l.qyteti}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.shenimi}>
          <Ikona emri={ikonat.mesazh} madhesia={18} ngjyra={ngjyrat.bronzi} />
          <Text style={styles.shenimiTeksti}>{t("kerkoTermin.shpjegimi")}</Text>
        </Animated.View>

        <Text style={styles.seksioni}>{t("rezervimi.sherbimi")}</Text>
        <View style={styles.zgjedhjet}>
          {SHERBIMET.map((s) => {
            const aktiv = s === sherbimi;
            return (
              <Pressable
                key={s}
                accessibilityRole="radio"
                accessibilityState={{ selected: aktiv }}
                onPress={() => {
                  prekja.zgjedhje();
                  setSherbimi(s);
                }}
                style={[styles.zgjedhja, aktiv && styles.zgjedhjaAktive]}
              >
                <Text style={[styles.zgjedhjaTeksti, aktiv && styles.zgjedhjaTekstiAktiv]}>
                  {t(`kerkoTermin.sherbimi_${s}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.seksioni}>{t("rezervimi.dita")}</Text>
        <ZgjedhesiIDites
          ditet={ditet}
          zgjedhur={data}
          onZgjidh={(d) => {
            prekja.zgjedhje();
            setData(d);
            setOra(null);
          }}
        />

        <Text style={styles.seksioni}>{t("rezervimi.ora")}</Text>
        {oret === null ? (
          <Text style={styles.bosh}>{t("kerkoTermin.mbyllur")}</Text>
        ) : oret.length === 0 ? (
          <Text style={styles.bosh}>{t("kerkoTermin.paOreSot")}</Text>
        ) : (
          <View style={styles.zgjedhjet}>
            {oret.map((o) => {
              const aktiv = o === ora;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: aktiv }}
                  onPress={() => {
                    prekja.zgjedhje();
                    setOra(o);
                  }}
                  style={[styles.ora, aktiv && styles.zgjedhjaAktive]}
                >
                  <Text style={[styles.zgjedhjaTeksti, aktiv && styles.zgjedhjaTekstiAktiv]}>{o}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Text style={styles.zbehte}>{kaOrar ? t("kerkoTermin.sipasOrarit") : t("kerkoTermin.paOrar")}</Text>

        {ora ? (
          <Animated.View entering={FadeInDown.duration(280)}>
            <Text style={styles.seksioni}>{t("kerkoTermin.mesazhiTitulli")}</Text>
            <View style={styles.flluska}>
              <Text style={styles.flluskaTeksti}>{mesazhi}</Text>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        {uDergua ? (
          <>
            <Text style={styles.fundiShenim}>{t("kerkoTermin.uDergua")}</Text>
            <Butoni titulli={t("kerkoTermin.mbyll")} varianti="dytesor" onPress={() => router.back()} />
          </>
        ) : !ora ? (
          <Butoni titulli={t("rezervimi.zgjidhOren")} joAktiv onPress={() => {}} />
        ) : celular && numri ? (
          <>
            <Butoni
              titulli={t("kerkoTermin.meWhatsApp")}
              ikona={ikonat.mesazh}
              onPress={() => hap(lidhjaWhatsApp(numri, mesazhi))}
            />
            <View style={styles.dyButona}>
              <Butoni
                titulli={t("kerkoTermin.meSms")}
                ikona={ikonat.sms}
                varianti="dytesor"
                onPress={() => hap(lidhjaSms(numri, mesazhi))}
                style={styles.gjysme}
              />
              <Butoni
                titulli={t("profiliLokalit.thirr")}
                ikona={ikonat.telefoni}
                varianti="dytesor"
                onPress={() => hap(lidhjaEThirrjes(numri))}
                style={styles.gjysme}
              />
            </View>
          </>
        ) : l.telefoni ? (
          <>
            <Text style={styles.fundiShenim}>{t("kerkoTermin.vetemThirrje")}</Text>
            <Butoni
              titulli={t("profiliLokalit.thirr")}
              ikona={ikonat.telefoni}
              onPress={() => hap(lidhjaEThirrjes(l.telefoni ?? ""))}
            />
          </>
        ) : (
          <Text style={styles.fundiShenim}>{t("profiliLokalit.paTerminTeksti")}</Text>
        )}
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
    permbajtja: {
      padding: hapesira.lg,
      gap: hapesira.sm,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      letterSpacing: -0.5,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      marginTop: 2,
    },
    shenimi: {
      flexDirection: "row",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      padding: hapesira.md,
      marginTop: hapesira.sm,
    },
    shenimiTeksti: {
      flex: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    seksioni: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
      marginTop: hapesira.lg,
      marginBottom: hapesira.xs,
    },
    zgjedhjet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    zgjedhja: {
      paddingHorizontal: hapesira.lg,
      height: 44,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
    },
    ora: {
      width: "23%",
      flexGrow: 1,
      maxWidth: 96,
      height: 44,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
    },
    zgjedhjaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    zgjedhjaTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
    },
    zgjedhjaTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    bosh: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
      paddingVertical: hapesira.md,
    },
    zbehte: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
      marginTop: hapesira.xs,
    },
    flluska: {
      alignSelf: "flex-end",
      maxWidth: "88%",
      backgroundColor: ngjyrat.blu,
      borderRadius: 18,
      borderBottomRightRadius: 6,
      borderCurve: "continuous",
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    flluskaTeksti: {
      color: "#FFFFFF",
      fontSize: 16,
      lineHeight: 21,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.vija,
      paddingHorizontal: hapesira.lg,
      paddingTop: hapesira.md,
      gap: hapesira.sm,
    },
    fundiShenim: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
    dyButona: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    gjysme: {
      flex: 1,
    },
  });
