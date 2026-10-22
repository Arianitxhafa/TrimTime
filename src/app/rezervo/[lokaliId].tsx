import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali } from "../../api/lokalet";
import { useSherbimet } from "../../api/sherbimet";
import { useStafi } from "../../api/stafi";
import { mesazhiIGabimitTeRezervimit, useOraretELira, useRezervoTermin } from "../../api/terminet";
import Avatar from "../../components/Avatar";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import RrjetaEOrareve from "../../components/RrjetaEOrareve";
import ZgjedhesiIDites from "../../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../../context/TemaContext";
import { ditetEArdhshme, formatoDaten } from "../../lib/datat";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import { planifikoKujtesat } from "../../lib/kujtesat";
import type { OraELire } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const DITET_PERPARA = 14;

type Suksesi = { data: string; ora: string; konfirmuar: boolean };

export default function Rezervo() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { lokaliId, sherbimiId: sherbimiNgaParametri } = useLocalSearchParams<{
    lokaliId: string;
    sherbimiId?: string;
  }>();

  const lokali = useLokali(lokaliId);
  const sherbimet = useSherbimet(lokaliId);
  const stafi = useStafi(lokaliId);
  const rezervo = useRezervoTermin();

  const ditet = useMemo(() => ditetEArdhshme(DITET_PERPARA), []);
  const [sherbimiId, setSherbimiId] = useState<string | null>(sherbimiNgaParametri ?? null);
  const [berberiId, setBerberiId] = useState<string | null>(null);
  const [data, setData] = useState(ditet[0]);
  const [ora, setOra] = useState<OraELire | null>(null);
  const [shenime, setShenime] = useState("");
  const [suksesi, setSuksesi] = useState<Suksesi | null>(null);

  const oraret = useOraretELira({ lokaliId, sherbimiId, data, berberiId });

  const sherbimetAktive = (sherbimet.data ?? []).filter((s) => s.aktiv);
  const sherbimi = sherbimetAktive.find((s) => s.id === sherbimiId) ?? null;
  const berberet = (stafi.data ?? []).filter((a) => a.aktiv);

  // Çdo ndryshim sipër e bën orën e zgjedhur të pavlefshme.
  function zgjidhSherbimin(id: string) {
    setSherbimiId(id);
    setOra(null);
  }
  function zgjidhBerberin(id: string | null) {
    setBerberiId(id);
    setOra(null);
  }
  function zgjidhDiten(d: string) {
    setData(d);
    setOra(null);
  }

  function konfirmo() {
    if (!sherbimi || !ora || !lokali.data) return;
    rezervo.mutate(
      {
        lokaliId,
        sherbimiId: sherbimi.id,
        fillonMe: ora.fillon_me,
        berberiId,
        shenime: shenime.trim() || null,
      },
      {
        onSuccess: (id) => {
          const konfirmuar = lokali.data!.pranimi_automatik;
          setSuksesi({ data, ora: ora.ora, konfirmuar });
          planifikoKujtesat(
            {
              id,
              fillon_me: ora.fillon_me,
              ora_lokale: ora.ora,
              lokali_emri: lokali.data!.emri,
              sherbimi_emri: sherbimi.emri,
              statusi: konfirmuar ? "konfirmuar" : "ne_pritje",
            },
            t,
          );
        },
        // Ora u zu nga dikush tjetër: hiqet zgjedhja, oraret rifreskohen vetë.
        onError: () => setOra(null),
      },
    );
  }

  if (!lokali.data || !sherbimet.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <Stack.Screen options={{ title: t("rezervimi.titulli") }} />
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  if (suksesi) {
    const dataTekst = formatoDaten(suksesi.data, t).toLowerCase();
    return (
      <View style={[styles.container, styles.qendra, styles.suksesi]}>
        <Stack.Screen options={{ title: "", headerBackVisible: false, gestureEnabled: false }} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.suksesiRrethi}>
          <Ikona emri={ikonat.konfirmo} madhesia={46} ngjyra={ngjyrat.mbiAri} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={styles.suksesiTeksti}>
          <Text style={styles.suksesiTitulli}>{t("rezervimi.suksesTitulli")}</Text>
          <Text style={styles.suksesiPershkrimi}>
            {suksesi.konfirmuar
              ? t("rezervimi.suksesKonfirmuar", { data: dataTekst, ora: suksesi.ora })
              : t("rezervimi.suksesPritje", { data: dataTekst, ora: suksesi.ora })}
          </Text>
          <Text style={styles.suksesiLokali}>
            {lokali.data.emri} · {sherbimi?.emri}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.suksesiButonat}>
          <Butoni
            titulli={t("rezervimi.shikoTerminet")}
            ikona={ikonat.kalendar}
            onPress={() => {
              router.dismissAll();
              router.navigate("/terminet-e-mia");
            }}
          />
          <Butoni titulli={t("rezervimi.kthehu")} varianti="dytesor" onPress={() => router.back()} />
        </Animated.View>
      </View>
    );
  }

  const afati = lokali.data.anulimi_deri_ore;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: lokali.data.emri }} />
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <Text style={styles.seksioni}>{t("rezervimi.sherbimi")}</Text>
        <View style={styles.grupi}>
          {sherbimetAktive.map((s, i) => {
            const aktiv = s.id === sherbimiId;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: aktiv }}
                onPress={() => zgjidhSherbimin(s.id)}
                style={[styles.sherbimi, i > 0 && styles.meKufi, aktiv && styles.sherbimiAktiv]}
              >
                <View style={[styles.radio, aktiv && styles.radioAktiv]}>
                  {aktiv && <View style={styles.radioPika} />}
                </View>
                <View style={styles.sherbimiTeksti}>
                  <Text style={styles.sherbimiEmri}>{s.emri}</Text>
                  <Text style={styles.sherbimiKoha}>{formatoKohezgjatjen(s.kohezgjatja_min)}</Text>
                </View>
                <Text style={styles.sherbimiCmimi}>{formatoCmimin(s.cmimi_centa)}</Text>
              </Pressable>
            );
          })}
        </View>

        {sherbimi && (
          <Animated.View entering={FadeInDown}>
            <Text style={styles.seksioni}>{t("rezervimi.berberi")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.berberetScroll}
              contentContainerStyle={styles.berberet}
            >
              <Berberi
                emri={t("rezervimi.kushdo")}
                nentitulli={t("rezervimi.kushdoTeksti")}
                aktiv={berberiId === null}
                onPress={() => zgjidhBerberin(null)}
                kushdo
              />
              {berberet.map((b) => (
                <Berberi
                  key={b.profili_id}
                  emri={b.emri.split(" ")[0] || "—"}
                  aktiv={berberiId === b.profili_id}
                  onPress={() => zgjidhBerberin(b.profili_id)}
                />
              ))}
            </ScrollView>

            <Text style={styles.seksioni}>{t("rezervimi.dita")}</Text>
            <ZgjedhesiIDites ditet={ditet} zgjedhur={data} onZgjidh={zgjidhDiten} />

            <Text style={styles.seksioni}>{t("rezervimi.ora")}</Text>
            <RrjetaEOrareve
              oraret={oraret.data}
              ngarkohet={oraret.isFetching}
              zgjedhur={ora?.fillon_me ?? null}
              onZgjidh={setOra}
            />

            <View style={styles.shenime}>
              <FushaTekstit
                etiketa={t("rezervimi.shenime")}
                value={shenime}
                onChangeText={setShenime}
                placeholder={t("rezervimi.shenimeShembull")}
                maxLength={500}
              />
            </View>

            <Text style={styles.info}>
              {afati > 0 ? t("rezervimi.anulimiInfo", { ore: afati }) : t("rezervimi.anulimiKurdo")}{" "}
              {t("rezervimi.paguanNeLokal")}
            </Text>
          </Animated.View>
        )}

        {rezervo.isError && (
          <View style={styles.gabimi}>
            <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(rezervo.error, t)} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <View style={styles.fundiTeksti}>
          <Text style={styles.fundiEtiketa}>{t("rezervimi.totali")}</Text>
          <Text style={styles.fundiCmimi}>{sherbimi ? formatoCmimin(sherbimi.cmimi_centa) : "—"}</Text>
          {ora ? (
            <Text style={styles.fundiKoha}>
              {formatoDaten(data, t)} · {ora.ora}
            </Text>
          ) : null}
        </View>
        <Butoni
          titulli={ora ? t("rezervimi.konfirmo") : t("rezervimi.zgjidhOren")}
          joAktiv={!ora || !sherbimi}
          ngarkohet={rezervo.isPending}
          onPress={konfirmo}
          style={styles.butoni}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

type BerberiProps = {
  emri: string;
  nentitulli?: string;
  aktiv: boolean;
  kushdo?: boolean;
  onPress: () => void;
};

function Berberi({ emri, nentitulli, aktiv, kushdo = false, onPress }: BerberiProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: aktiv }}
      onPress={onPress}
      style={[styles.berberi, aktiv && styles.berberiAktiv]}
    >
      {kushdo ? (
        <View style={styles.kushdoIkona}>
          <Ikona emri={ikonat.klientet} madhesia={22} ngjyra={ngjyrat.ari} />
        </View>
      ) : (
        <Avatar emri={emri} madhesia={48} />
      )}
      <Text style={styles.berberiEmri} numberOfLines={1}>
        {emri}
      </Text>
      {nentitulli ? (
        <Text style={styles.berberiNentitulli} numberOfLines={1}>
          {nentitulli}
        </Text>
      ) : null}
    </Pressable>
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
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.lg,
      marginBottom: hapesira.md,
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
    sherbimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    sherbimiAktiv: {
      backgroundColor: ngjyrat.ariIErret,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: ngjyrat.tekstiZbehte,
      alignItems: "center",
      justifyContent: "center",
    },
    radioAktiv: {
      borderColor: ngjyrat.ari,
    },
    radioPika: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: ngjyrat.ari,
    },
    sherbimiTeksti: {
      flex: 1,
      gap: 2,
    },
    sherbimiEmri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    sherbimiKoha: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    sherbimiCmimi: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    berberetScroll: {
      marginHorizontal: -hapesira.xl,
    },
    berberet: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    berberi: {
      width: 96,
      alignItems: "center",
      gap: 6,
      paddingVertical: hapesira.md,
      paddingHorizontal: hapesira.sm,
      borderRadius: rrezja.md,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
    },
    berberiAktiv: {
      borderColor: ngjyrat.ari,
      backgroundColor: ngjyrat.ariIErret,
    },
    kushdoIkona: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    berberiEmri: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    berberiNentitulli: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 11,
      marginTop: -4,
    },
    shenime: {
      marginTop: hapesira.xl,
    },
    info: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 19,
    },
    gabimi: {
      marginTop: hapesira.lg,
    },
    fundi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    fundiTeksti: {
      flex: 1,
    },
    fundiEtiketa: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      fontWeight: "600",
    },
    fundiCmimi: {
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
    },
    fundiKoha: {
      color: ngjyrat.ari,
      fontSize: 13,
      fontWeight: "700",
    },
    butoni: {
      minWidth: 170,
    },
    suksesi: {
      paddingHorizontal: hapesira.xxl,
    },
    suksesiRrethi: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.xl,
    },
    suksesiTeksti: {
      alignItems: "center",
      gap: hapesira.sm,
    },
    suksesiTitulli: {
      color: ngjyrat.teksti,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      textAlign: "center",
    },
    suksesiPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
      textAlign: "center",
    },
    suksesiLokali: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    suksesiButonat: {
      alignSelf: "stretch",
      gap: hapesira.md,
      marginTop: hapesira.xxl,
    },
  });
