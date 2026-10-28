import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAnalitika } from "../../api/biznesi";
import { useLokaliIm } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, ngaISO, shtoDite } from "../../lib/datat";
import { formatoCmimin } from "../../lib/formatimi";
import type { Analitika } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

type Periudha = "d7" | "d30" | "muaji";

function kufijtE(periudha: Periudha, sot: string): { nga: string; deri: string } {
  if (periudha === "d7") return { nga: shtoDite(sot, -6), deri: sot };
  if (periudha === "d30") return { nga: shtoDite(sot, -29), deri: sot };
  const d = ngaISO(sot);
  return { nga: dataISO(new Date(d.getFullYear(), d.getMonth(), 1)), deri: sot };
}

export default function EkraniIAnalitikes() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokaliIm = useLokaliIm();
  const [periudha, setPeriudha] = useState<Periudha>("d7");
  const sot = useMemo(() => dataISO(new Date()), []);
  const { nga, deri } = kufijtE(periudha, sot);
  const analitika = useAnalitika(lokaliIm.data?.lokali.id, nga, deri);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <View style={styles.periudhat}>
        {(["d7", "d30", "muaji"] as const).map((p) => (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityState={{ selected: periudha === p }}
            onPress={() => setPeriudha(p)}
            style={[styles.periudha, periudha === p && styles.periudhaAktive]}
          >
            <Text style={[styles.periudhaTeksti, periudha === p && styles.periudhaTekstiAktiv]}>
              {t(`analitika.${p}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {analitika.isPending ? (
        <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
      ) : analitika.isError || !analitika.data ? (
        <View style={styles.bosh}>
          <Text style={styles.boshTeksti}>{t("pergjithshme.gabimPapritur")}</Text>
          <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => analitika.refetch()} />
        </View>
      ) : (
        <Permbajtja a={analitika.data} nga={nga} deri={deri} />
      )}
    </ScrollView>
  );
}

function Permbajtja({ a, nga, deri }: { a: Analitika; nga: string; deri: string }) {
  const { t } = useTranslation();
  const { statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);

  // Çdo ditë e periudhës, edhe ato pa termine, që grafiku të mos ketë boshllëqe.
  const ditet = useMemo(() => {
    const sipasDates = new Map(a.sipas_dites.map((d) => [d.data, d.te_ardhura]));
    const lista: { data: string; te_ardhura: number }[] = [];
    for (let d = nga; d <= deri; d = shtoDite(d, 1)) lista.push({ data: d, te_ardhura: sipasDates.get(d) ?? 0 });
    return lista;
  }, [a.sipas_dites, nga, deri]);

  const maxDite = Math.max(1, ...ditet.map((d) => d.te_ardhura));
  const maxOre = Math.max(1, ...a.oret.map((o) => o.termine));
  const maxSherbim = Math.max(1, ...a.sherbimet.map((s) => s.termine));
  const maxBerber = Math.max(1, ...a.berberet.map((b) => b.termine));
  const perqindjaMosardhjes = a.termine > 0 ? Math.round((a.nuk_erdhi / a.termine) * 100) : 0;

  if (a.termine === 0 && a.anuluar === 0) {
    return <Text style={styles.paTeDhena}>{t("analitika.paTeDhena")}</Text>;
  }

  return (
    <>
      <View style={styles.kartat}>
        <Karta vlera={formatoCmimin(a.te_ardhura)} etiketa={t("analitika.teArdhura")} theksuar />
        <Karta vlera={String(a.termine)} etiketa={t("analitika.termine")} />
        <Karta vlera={`${perqindjaMosardhjes}%`} etiketa={t("analitika.mosardhje")} />
        <Karta vlera={`${a.klientet_e_rinj} / ${a.klientet_qe_kthehen}`} etiketa={`${t("analitika.klientetERinj")} / ${t("analitika.klientetQeKthehen")}`} />
      </View>

      <Text style={styles.seksioni}>{t("analitika.pagesat")}</Text>
      <View style={styles.kartat}>
        <Karta vlera={formatoCmimin(a.paguar_kesh)} etiketa={t("analitika.kesh")} />
        <Karta vlera={formatoCmimin(a.paguar_karte)} etiketa={t("analitika.karte")} />
        <Karta vlera={formatoCmimin(a.pa_paguar)} etiketa={t("analitika.paPaguar")} />
        <Karta
          vlera={formatoCmimin(a.zbritjet)}
          etiketa={a.shperblime > 0 ? `${t("analitika.zbritjet")} · ${a.shperblime} ${t("analitika.shperblime").toLowerCase()}` : t("analitika.zbritjet")}
        />
        {a.nr_vleresimeve > 0 && (
          <Karta
            vlera={`★ ${Number(a.vleresimi_mesatar ?? 0).toFixed(1)}`}
            etiketa={`${t("analitika.vleresimi")} · ${a.nr_vleresimeve}`}
          />
        )}
      </View>

      <Text style={styles.seksioni}>{t("analitika.sipasDites")}</Text>
      <View style={styles.grafiku}>
        {ditet.map((d) => (
          <View key={d.data} style={styles.kolonaEGrafikut}>
            <View
              style={[
                styles.shtylla,
                { height: `${Math.max(2, (d.te_ardhura / maxDite) * 100)}%`, opacity: d.te_ardhura ? 1 : 0.25 },
              ]}
            />
            {ditet.length <= 7 && <Text style={styles.etiketaEShtylles}>{ngaISO(d.data).getDate()}</Text>}
          </View>
        ))}
      </View>

      <Text style={styles.seksioni}>{t("analitika.sherbimetKryesore")}</Text>
      <View style={styles.grupi}>
        {a.sherbimet.map((s) => (
          <ShiritiHorizontal
            key={s.emri}
            emri={s.emri}
            vlera={t("analitika.termineNumri", { numri: s.termine })}
            pjesa={s.termine / maxSherbim}
          />
        ))}
      </View>

      {a.berberet.length > 1 && (
        <>
          <Text style={styles.seksioni}>{t("analitika.berberet")}</Text>
          <View style={styles.grupi}>
            {a.berberet.map((b) => (
              <ShiritiHorizontal
                key={b.emri}
                emri={b.emri.split(" ")[0] || "—"}
                vlera={`${t("analitika.termineNumri", { numri: b.termine })} · ${formatoCmimin(b.te_ardhura)}`}
                pjesa={b.termine / maxBerber}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.seksioni}>{t("analitika.oretEPikut")}</Text>
      <View style={styles.grafiku}>
        {a.oret.map((o) => (
          <View key={o.ora} style={styles.kolonaEGrafikut}>
            <View
              style={[
                styles.shtylla,
                { height: `${Math.max(4, (o.termine / maxOre) * 100)}%`, backgroundColor: statusetMeta.perfunduar.ngjyra },
              ]}
            />
            <Text style={styles.etiketaEShtylles}>{o.ora}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function Karta({ vlera, etiketa, theksuar = false }: { vlera: string; etiketa: string; theksuar?: boolean }) {
  const styles = useStilet(krijoStilet);
  return (
    <View style={[styles.karta, theksuar && styles.kartaETheksuar]}>
      <Text style={[styles.kartaVlera, theksuar && styles.kartaVleraETheksuar]}>{vlera}</Text>
      <Text style={[styles.kartaEtiketa, theksuar && styles.kartaVleraETheksuar]} numberOfLines={2}>
        {etiketa}
      </Text>
    </View>
  );
}

function ShiritiHorizontal({ emri, vlera, pjesa }: { emri: string; vlera: string; pjesa: number }) {
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.shiriti}>
      <View style={styles.shiritiKoka}>
        <Text style={styles.shiritiEmri} numberOfLines={1}>
          {emri}
        </Text>
        <Text style={styles.shiritiVlera}>{vlera}</Text>
      </View>
      <View style={styles.shiritiSfondi}>
        <View style={[styles.shiritiMbushja, { width: `${Math.max(3, pjesa * 100)}%` }]} />
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
      padding: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    periudhat: {
      flexDirection: "row",
      padding: 4,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      marginBottom: hapesira.xl,
    },
    periudha: {
      flex: 1,
      height: 36,
      borderRadius: rrezja.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    periudhaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    periudhaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "700",
    },
    periudhaTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.md,
      marginTop: hapesira.xxl,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    paTeDhena: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
      marginTop: hapesira.xxl,
    },
    kartat: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    karta: {
      flexGrow: 1,
      flexBasis: "45%",
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: 4,
    },
    kartaETheksuar: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    kartaVlera: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    kartaVleraETheksuar: {
      color: ngjyrat.mbiAri,
    },
    kartaEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "600",
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.xxl,
      marginBottom: hapesira.md,
    },
    grafiku: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 3,
      height: 140,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
    },
    kolonaEGrafikut: {
      flex: 1,
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    shtylla: {
      width: "100%",
      borderRadius: 4,
      backgroundColor: ngjyrat.ari,
    },
    etiketaEShtylles: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 10,
      fontWeight: "600",
      marginTop: 4,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.lg,
    },
    shiriti: {
      gap: 6,
    },
    shiritiKoka: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: hapesira.md,
    },
    shiritiEmri: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    shiritiVlera: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "600",
    },
    shiritiSfondi: {
      height: 8,
      borderRadius: 4,
      backgroundColor: ngjyrat.siperfaqja2,
      overflow: "hidden",
    },
    shiritiMbushja: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: ngjyrat.ari,
    },
  });
