import { router, useLocalSearchParams } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../api/lokalet";
import { useSherbimet } from "../api/sherbimet";
import { useStafi } from "../api/stafi";
import { mesazhiIGabimitTeRezervimit, useOraretELira, useShtoTerminNgaStafi } from "../api/terminet";
import Butoni from "../components/Butoni";
import FushaTekstit from "../components/FushaTekstit";
import { ikonat } from "../components/Ikona";
import { GabimiIFormes } from "../components/KornizaAuth";
import RrjetaEOrareve from "../components/RrjetaEOrareve";
import ZgjedhesiIDites from "../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../context/TemaContext";
import { ditetEArdhshme } from "../lib/datat";
import { formatoCmimin, formatoKohezgjatjen } from "../lib/formatimi";
import type { OraELire } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

function kthehu() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

// Termin i shtuar nga stafi: klient pa llogari (walk-in ose rezervim me telefon).
export default function ShtoTermin() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { data: dataNgaParametri } = useLocalSearchParams<{ data?: string }>();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const sherbimet = useSherbimet(lokaliId);
  const stafi = useStafi(lokaliId);
  const shto = useShtoTerminNgaStafi();

  const ditet = useMemo(() => ditetEArdhshme(14), []);
  const [klienti, setKlienti] = useState("");
  const [telefoni, setTelefoni] = useState("");
  const [sherbimiId, setSherbimiId] = useState<string | null>(null);
  const [berberiId, setBerberiId] = useState<string | null>(null);
  const [data, setData] = useState(dataNgaParametri && ditet.includes(dataNgaParametri) ? dataNgaParametri : ditet[0]);
  const [ora, setOra] = useState<OraELire | null>(null);
  const [shenime, setShenime] = useState("");
  const [provuar, setProvuar] = useState(false);

  const oraret = useOraretELira({ lokaliId: lokaliId ?? "", sherbimiId, data, berberiId, perStafin: true });

  const gabimet = {
    klienti: klienti.trim().length >= 2 ? null : t("terminIRi.gabimEmri"),
    sherbimi: sherbimiId ? null : t("terminIRi.gabimSherbimi"),
    ora: ora ? null : t("terminIRi.gabimOra"),
  };

  function ruaj() {
    setProvuar(true);
    if (!lokaliId || !sherbimiId || !ora || gabimet.klienti) return;
    shto.mutate(
      {
        lokaliId,
        sherbimiId,
        fillonMe: ora.fillon_me,
        berberiId: berberiId ?? ora.berberi_id,
        emriKlientit: klienti.trim(),
        telefoni: telefoni.trim() || null,
        shenime: shenime.trim() || null,
      },
      { onSuccess: kthehu, onError: () => setOra(null) },
    );
  }

  if (!lokaliId || !sherbimet.data || !stafi.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  const berberet = stafi.data.filter((a) => a.aktiv);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        {shto.isError && <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(shto.error, t)} />}

        <FushaTekstit
          etiketa={t("terminIRi.klienti")}
          ikona={ikonat.personi}
          value={klienti}
          onChangeText={setKlienti}
          placeholder={t("terminIRi.klientiShembull")}
          autoCapitalize="words"
          maxLength={80}
          gabimi={provuar ? gabimet.klienti : null}
        />
        <FushaTekstit
          etiketa={t("terminIRi.telefoni")}
          ikona={ikonat.telefoni}
          value={telefoni}
          onChangeText={setTelefoni}
          placeholder="+383 4x xxx xxx"
          keyboardType="phone-pad"
          maxLength={30}
        />

        <Text style={styles.etiketa}>{t("rezervimi.sherbimi")}</Text>
        <View style={styles.zgjedhjet}>
          {sherbimet.data
            .filter((s) => s.aktiv)
            .map((s) => {
              const aktiv = s.id === sherbimiId;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: aktiv }}
                  onPress={() => {
                    setSherbimiId(s.id);
                    setOra(null);
                  }}
                  style={[styles.zgjedhja, aktiv && styles.zgjedhjaAktive]}
                >
                  <Text style={[styles.zgjedhjaTeksti, aktiv && styles.zgjedhjaTekstiAktiv]}>{s.emri}</Text>
                  <Text style={[styles.zgjedhjaDetaje, aktiv && styles.zgjedhjaTekstiAktiv]}>
                    {formatoKohezgjatjen(s.kohezgjatja_min)} · {formatoCmimin(s.cmimi_centa)}
                  </Text>
                </Pressable>
              );
            })}
        </View>
        {provuar && gabimet.sherbimi ? <Text style={styles.gabimi}>{gabimet.sherbimi}</Text> : null}

        <Text style={styles.etiketa}>{t("rezervimi.berberi")}</Text>
        <View style={styles.zgjedhjet}>
          {[{ profili_id: null, emri: t("rezervimi.kushdo") }, ...berberet].map((b) => {
            const aktiv = berberiId === b.profili_id;
            return (
              <Pressable
                key={b.profili_id ?? "kushdo"}
                accessibilityRole="radio"
                accessibilityState={{ selected: aktiv }}
                onPress={() => {
                  setBerberiId(b.profili_id);
                  setOra(null);
                }}
                style={[styles.zgjedhja, aktiv && styles.zgjedhjaAktive]}
              >
                <Text style={[styles.zgjedhjaTeksti, aktiv && styles.zgjedhjaTekstiAktiv]}>
                  {b.emri.split(" ")[0] || "—"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.etiketa}>{t("rezervimi.dita")}</Text>
        <View style={styles.ditet}>
          <ZgjedhesiIDites
            ditet={ditet}
            zgjedhur={data}
            onZgjidh={(d) => {
              setData(d);
              setOra(null);
            }}
          />
        </View>

        {sherbimiId && (
          <>
            <Text style={styles.etiketa}>{t("rezervimi.ora")}</Text>
            <RrjetaEOrareve
              oraret={oraret.data}
              ngarkohet={oraret.isFetching}
              zgjedhur={ora?.fillon_me ?? null}
              onZgjidh={setOra}
            />
            {provuar && gabimet.ora ? <Text style={styles.gabimi}>{gabimet.ora}</Text> : null}
          </>
        )}

        <View style={styles.shenime}>
          <FushaTekstit
            etiketa={t("rezervimi.shenime")}
            value={shenime}
            onChangeText={setShenime}
            shumeRreshta
            maxLength={500}
          />
        </View>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("pergjithshme.anulo")} varianti="dytesor" onPress={kthehu} style={styles.butoniAnulo} />
        <Butoni
          titulli={t("terminIRi.ruaj")}
          ikona={ikonat.konfirmo}
          ngarkohet={shto.isPending}
          onPress={ruaj}
          style={styles.butoniRuaj}
        />
      </View>
    </KeyboardAvoidingView>
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
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      marginTop: hapesira.sm,
      marginBottom: hapesira.sm,
    },
    zgjedhjet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.md,
    },
    zgjedhja: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      gap: 2,
    },
    zgjedhjaAktive: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    zgjedhjaTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    zgjedhjaDetaje: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
    },
    zgjedhjaTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    ditet: {
      marginBottom: hapesira.md,
    },
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      fontWeight: "600",
      marginTop: -4,
      marginBottom: hapesira.md,
    },
    shenime: {
      marginTop: hapesira.lg,
    },
    fundi: {
      flexDirection: "row",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.sfondi,
    },
    butoniAnulo: {
      flex: 1,
    },
    butoniRuaj: {
      flex: 2,
    },
  });
