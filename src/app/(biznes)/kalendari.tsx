import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePushimet, useTerminetEPeriudhes } from "../../api/biznesi";
import { useLokaliIm } from "../../api/lokalet";
import { useOrari } from "../../api/orari";
import { useStafi } from "../../api/stafi";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, emriShkurterIDites, formatoDaten, ngaISO, shtoDite } from "../../lib/datat";
import type { Pushimi, TerminiIKalendarit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

type Pamja = "dita" | "java";

const PX_PER_MINUTE = 1.4;
const GJERESIA_E_ORES = 48;
const GJERESIA_MIN_E_KOLONES = 140;

function fillimiIJaves(iso: string): string {
  return shtoDite(iso, -((ngaISO(iso).getDay() + 6) % 7));
}

// Pjesa e pushimit që bie brenda një dite, në minuta nga mesnata.
function pushimiNeDite(p: Pushimi, data: string): { nga: number; deri: number } | null {
  const fillimiIDites = ngaISO(data).getTime();
  const fundiIDites = fillimiIDites + 24 * 3_600_000;
  const nga = Math.max(new Date(p.fillon_me).getTime(), fillimiIDites);
  const deri = Math.min(new Date(p.mbaron_me).getTime(), fundiIDites);
  if (deri <= nga) return null;
  return { nga: (nga - fillimiIDites) / 60_000, deri: (deri - fillimiIDites) / 60_000 };
}

export default function Kalendari() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;

  const sot = dataISO(new Date());
  const [pamja, setPamja] = useState<Pamja>("dita");
  const [data, setData] = useState(sot);
  const [berberiIJaves, setBerberiIJaves] = useState<string | null>(null);

  const nga = pamja === "dita" ? data : fillimiIJaves(data);
  const deri = pamja === "dita" ? data : shtoDite(nga, 6);
  const ditetEJaves = useMemo(() => Array.from({ length: 7 }, (_, i) => shtoDite(nga, i)), [nga]);

  const stafi = useStafi(lokaliId);
  const orari = useOrari(lokaliId);
  const terminet = useTerminetEPeriudhes(lokaliId, nga, deri);
  const pushimet = usePushimet(
    lokaliId,
    ngaISO(nga).toISOString(),
    ngaISO(shtoDite(deri, 1)).toISOString(),
  );

  const berberet = (stafi.data ?? []).filter((a) => a.aktiv);

  // Kalendari tregon orët e punës së lokalit, të zgjeruara nëse ka termine jashtë tyre.
  const { fillimi, fundi } = useMemo(() => {
    const oraret = orari.data ?? [];
    let f = oraret.length ? Math.min(...oraret.map((o) => +o.hapet.slice(0, 2))) * 60 : 8 * 60;
    let e = oraret.length
      ? Math.max(...oraret.map((o) => Math.ceil(+o.mbyllet.slice(0, 2) + +o.mbyllet.slice(3) / 60))) * 60
      : 20 * 60;
    for (const x of terminet.data ?? []) {
      f = Math.min(f, Math.floor(x.minuta_e_dites / 60) * 60);
      e = Math.max(e, Math.ceil((x.minuta_e_dites + x.kohezgjatja_min) / 60) * 60);
    }
    return { fillimi: f, fundi: Math.max(e, f + 60) };
  }, [orari.data, terminet.data]);

  const lartesia = (fundi - fillimi) * PX_PER_MINUTE;
  const oret = Array.from({ length: (fundi - fillimi) / 60 + 1 }, (_, i) => fillimi / 60 + i);

  function levizDiten(drejtimi: number) {
    setData(shtoDite(data, pamja === "dita" ? drejtimi : drejtimi * 7));
  }

  // isLoading (jo isPending): pa lokal, query-t e varura janë të çaktivizuara dhe s'ngarkohen kurrë.
  if (lokaliIm.isPending || stafi.isLoading) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  if (!lokaliId || berberet.length === 0) {
    return (
      <View style={[styles.container, styles.qendra, { paddingTop: insets.top }]}>
        <Ikona emri={ikonat.kalendar} madhesia={32} ngjyra={ngjyrat.ari} />
        <Text style={styles.boshTeksti}>{lokaliId ? t("kalendari.paStaf") : t("sot.paLokal")}</Text>
      </View>
    );
  }

  const kolonat =
    pamja === "dita"
      ? berberet.map((b) => ({ celesi: b.profili_id, titulli: b.emri.split(" ")[0] || "—", data, berberiId: b.profili_id }))
      : ditetEJaves.map((d) => ({
          celesi: d,
          titulli: `${emriShkurterIDites(d, t)} ${ngaISO(d).getDate()}`,
          data: d,
          berberiId: berberiIJaves,
        }));

  const hapesiraEKolonave = width - GJERESIA_E_ORES - hapesira.lg;
  const gjeresiaEKolones =
    pamja === "java"
      ? hapesiraEKolonave / 7
      : Math.max(GJERESIA_MIN_E_KOLONES, hapesiraEKolonave / kolonat.length);

  const tani = new Date();
  const minutatTani = tani.getHours() * 60 + tani.getMinutes();

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.md }]}>
      <View style={styles.koka}>
        <View style={styles.pamjet}>
          {(["dita", "java"] as const).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="tab"
              accessibilityState={{ selected: pamja === p }}
              onPress={() => setPamja(p)}
              style={[styles.pamja, pamja === p && styles.pamjaAktive]}
            >
              <Text style={[styles.pamjaTeksti, pamja === p && styles.pamjaTekstiAktiv]}>{t(`kalendari.${p}`)}</Text>
            </Pressable>
          ))}
        </View>
        {data !== sot && (
          <Pressable accessibilityRole="button" onPress={() => setData(sot)} style={styles.sot} hitSlop={6}>
            <Text style={styles.sotTeksti}>{t("kalendari.sot")}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.navigimi}>
        <Pressable accessibilityRole="button" onPress={() => levizDiten(-1)} hitSlop={10} style={styles.shigjeta}>
          <Ikona emri={ikonat.majtas} madhesia={18} ngjyra={ngjyrat.teksti} />
        </Pressable>
        <Text style={styles.periudha}>
          {pamja === "dita" ? formatoDaten(data, t) : `${formatoDaten(nga, t)} – ${formatoDaten(deri, t)}`}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => levizDiten(1)} hitSlop={10} style={styles.shigjeta}>
          <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.teksti} />
        </Pressable>
      </View>

      {pamja === "java" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtratScroll}
          contentContainerStyle={styles.filtrat}
        >
          {[{ profili_id: null, emri: t("kalendari.teGjithe") }, ...berberet].map((b) => {
            const aktiv = berberiIJaves === b.profili_id;
            return (
              <Pressable
                key={b.profili_id ?? "te-gjithe"}
                accessibilityRole="button"
                accessibilityState={{ selected: aktiv }}
                onPress={() => setBerberiIJaves(b.profili_id)}
                style={[styles.chip, aktiv && styles.chipAktiv]}
              >
                <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{b.emri.split(" ")[0]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView style={styles.trupi} contentContainerStyle={{ paddingBottom: hapesira.xxl }}>
        <View style={styles.rreshti}>
          <View style={{ width: GJERESIA_E_ORES, paddingTop: 36 }}>
            {oret.map((o) => (
              <Text key={o} style={[styles.ora, { top: (o * 60 - fillimi) * PX_PER_MINUTE + 36 - 7 }]}>
                {String(o).padStart(2, "0")}:00
              </Text>
            ))}
          </View>

          <ScrollView horizontal scrollEnabled={pamja === "dita"} showsHorizontalScrollIndicator={false}>
            {kolonat.map((k) => {
              const eSotme = k.data === sot;
              const terminetEKolones = (terminet.data ?? []).filter(
                (x) => x.data_lokale === k.data && (!k.berberiId || x.berberi_id === k.berberiId),
              );
              const pushimetEKolones = (pushimet.data ?? [])
                .filter((p) => !k.berberiId || p.profili_id === k.berberiId)
                .map((p) => ({ id: p.id, pjesa: pushimiNeDite(p, k.data) }))
                .filter((p) => p.pjesa !== null);

              return (
                <View key={k.celesi} style={{ width: gjeresiaEKolones }}>
                  <Text style={[styles.kolonaTitulli, eSotme && pamja === "java" && styles.eSotme]} numberOfLines={1}>
                    {k.titulli}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("sot.shtoTermin")}
                    onPress={() => router.push({ pathname: "/shto", params: { data: k.data } })}
                    style={[styles.kolona, { height: lartesia }]}
                  >
                    {oret.slice(0, -1).map((o) => (
                      <View
                        key={o}
                        style={[styles.vijaEOres, { top: (o * 60 - fillimi) * PX_PER_MINUTE }]}
                      />
                    ))}

                    {pushimetEKolones.map(({ id, pjesa }) => {
                      const top = Math.max(0, (pjesa!.nga - fillimi) * PX_PER_MINUTE);
                      const fund = Math.min(lartesia, (pjesa!.deri - fillimi) * PX_PER_MINUTE);
                      if (fund <= top) return null;
                      return (
                        <View key={id} style={[styles.pushimi, { top, height: fund - top }]}>
                          {pamja === "dita" && <Text style={styles.pushimiTeksti}>{t("kalendari.pushim")}</Text>}
                        </View>
                      );
                    })}

                    {terminetEKolones.map((x) => (
                      <Blloku
                        key={x.id}
                        termini={x}
                        top={(x.minuta_e_dites - fillimi) * PX_PER_MINUTE}
                        kompakt={pamja === "java"}
                      />
                    ))}

                    {eSotme && minutatTani >= fillimi && minutatTani <= fundi && (
                      <View style={[styles.vijaETanishme, { top: (minutatTani - fillimi) * PX_PER_MINUTE }]} />
                    )}
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function Blloku({ termini, top, kompakt }: { termini: TerminiIKalendarit; top: number; kompakt: boolean }) {
  const { statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const meta = statusetMeta[termini.statusi];
  const lartesia = Math.max(termini.kohezgjatja_min * PX_PER_MINUTE, 24);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${termini.klienti_emri}, ${termini.ora_lokale}`}
      onPress={() => router.push({ pathname: "/termini/[id]", params: { id: termini.id, data: termini.data_lokale } })}
      style={[
        styles.blloku,
        { top, height: lartesia, backgroundColor: meta.sfondi, borderLeftColor: meta.ngjyra },
        termini.statusi === "anuluar" && styles.bllokuAnuluar,
      ]}
    >
      <Text style={[styles.bllokuOra, { color: meta.ngjyra }]} numberOfLines={1}>
        {termini.ora_lokale}
      </Text>
      {!kompakt && (
        <>
          <Text style={styles.bllokuKlienti} numberOfLines={1}>
            {termini.klienti_emri}
          </Text>
          {lartesia > 52 && (
            <Text style={styles.bllokuSherbimi} numberOfLines={1}>
              {termini.sherbimi_emri}
            </Text>
          )}
        </>
      )}
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
      gap: hapesira.md,
      paddingHorizontal: hapesira.xxl,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.md,
    },
    pamjet: {
      flexDirection: "row",
      padding: 4,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    pamja: {
      paddingHorizontal: hapesira.lg,
      height: 34,
      borderRadius: rrezja.sm,
      justifyContent: "center",
    },
    pamjaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    pamjaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "700",
    },
    pamjaTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    sot: {
      paddingHorizontal: hapesira.md,
      height: 34,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.ari,
      justifyContent: "center",
    },
    sotTeksti: {
      color: ngjyrat.ari,
      fontSize: 13,
      fontWeight: "800",
    },
    navigimi: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.md,
    },
    shigjeta: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    periudha: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    filtratScroll: {
      flexGrow: 0,
      marginBottom: hapesira.md,
    },
    filtrat: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    chip: {
      paddingHorizontal: 14,
      height: 34,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.teksti,
      borderColor: ngjyrat.teksti,
    },
    chipTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.sfondi,
    },
    trupi: {
      flex: 1,
    },
    rreshti: {
      flexDirection: "row",
      paddingRight: hapesira.lg,
    },
    ora: {
      position: "absolute",
      right: 6,
      color: ngjyrat.tekstiZbehte,
      fontSize: 11,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    kolonaTitulli: {
      height: 36,
      color: ngjyrat.teksti,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
      textAlignVertical: "center",
      lineHeight: 36,
      paddingHorizontal: 4,
    },
    eSotme: {
      color: ngjyrat.ari,
    },
    kolona: {
      borderLeftWidth: 1,
      borderLeftColor: ngjyrat.kufiri,
    },
    vijaEOres: {
      position: "absolute",
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    pushimi: {
      position: "absolute",
      left: 2,
      right: 2,
      borderRadius: 6,
      backgroundColor: ngjyrat.siperfaqja2,
      opacity: 0.85,
      alignItems: "center",
      justifyContent: "center",
    },
    pushimiTeksti: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 11,
      fontWeight: "700",
    },
    blloku: {
      position: "absolute",
      left: 3,
      right: 3,
      borderRadius: 8,
      borderLeftWidth: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      overflow: "hidden",
    },
    bllokuAnuluar: {
      opacity: 0.45,
    },
    bllokuOra: {
      fontSize: 11,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    bllokuKlienti: {
      color: ngjyrat.teksti,
      fontSize: 12,
      fontWeight: "700",
    },
    bllokuSherbimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
    },
    vijaETanishme: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: ngjyrat.rrezik,
    },
  });
