import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
import { useTerminetELokalit } from "../../api/terminet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaTerminit from "../../components/KartaTerminit";
import ZgjedhesiIDites from "../../components/ZgjedhesiIDites";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, ditetEArdhshme, formatoDaten } from "../../lib/datat";
import { formatoCmimin } from "../../lib/formatimi";
import { STATUSET, type StatusiTerminit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

type Filtri = "te_gjitha" | StatusiTerminit;

function hapTerminin(id: string, data: string) {
  router.push({ pathname: "/termini/[id]", params: { id, data } });
}

export default function Sot() {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const lokaliIm = useLokaliIm();
  const lokali = lokaliIm.data?.lokali;

  const ditet = useMemo(() => ditetEArdhshme(14), []);
  const [data, setData] = useState(ditet[0]);
  const [filtri, setFiltri] = useState<Filtri>("te_gjitha");
  const [kerkimi, setKerkimi] = useState("");

  const terminet = useTerminetELokalit(lokali?.id, data);

  const lista = useMemo(() => terminet.data ?? [], [terminet.data]);
  const numri = (s: StatusiTerminit) => lista.filter((x) => x.statusi === s).length;
  const teArdhurat = lista
    .filter((x) => x.statusi === "perfunduar")
    .reduce((shuma, x) => shuma + x.cmimi_centa, 0);

  const tani = new Date().toISOString();
  const iRadhes = lista.find(
    (x) => (x.statusi === "konfirmuar" || x.statusi === "ne_pritje") && (data !== dataISO(new Date()) || x.fillon_me >= tani),
  );

  const teFiltruara = useMemo(() => {
    const k = kerkimi.trim().toLowerCase();
    return lista.filter(
      (x) =>
        (filtri === "te_gjitha" || x.statusi === filtri) &&
        (k === "" || x.klienti_emri.toLowerCase().includes(k) || x.sherbimi_emri.toLowerCase().includes(k)),
    );
  }, [lista, filtri, kerkimi]);

  const kaFiltra = filtri !== "te_gjitha" || kerkimi.trim() !== "";

  if (lokaliIm.isPending) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  if (!lokali) {
    return (
      <View style={[styles.container, styles.qendra, { paddingTop: insets.top }]}>
        <View style={styles.boshIkona}>
          <Ikona emri={ikonat.lokali} madhesia={28} ngjyra={ngjyrat.ari} />
        </View>
        <Text style={styles.boshTeksti}>{t("sot.paLokal")}</Text>
        <Butoni titulli={t("sot.hapLokalin")} ikona={ikonat.lokali} onPress={() => router.navigate("/lokali")} />
      </View>
    );
  }

  const koka = (
    <View>
      <View style={styles.koka}>
        <View style={styles.kokaTeksti}>
          <Text style={styles.data}>{formatoDaten(data, t)}</Text>
          <Text style={styles.titulli} numberOfLines={1}>
            {lokali.emri}
          </Text>
        </View>
        <View style={styles.kokaButonat}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("cilesimet.titulli")}
            onPress={() => router.push("/cilesimet")}
            style={({ pressed }) => [styles.butoniCilesimet, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.cilesimet} madhesia={20} ngjyra={ngjyrat.teksti} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("sot.shtoTermin")}
            onPress={() => router.push({ pathname: "/shto", params: { data } })}
            style={({ pressed }) => [styles.butoniShto, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.shto} madhesia={22} ngjyra={ngjyrat.mbiAri} />
          </Pressable>
        </View>
      </View>

      <View style={styles.ditet}>
        <ZgjedhesiIDites ditet={ditet} zgjedhur={data} onZgjidh={setData} />
      </View>

      {iRadhes ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => hapTerminin(iRadhes.id, data)}
          style={({ pressed }) => [styles.iRadhes, pressed && styles.shtypur]}
        >
          <View style={styles.iRadhesKoka}>
            <Text style={styles.iRadhesEtiketa}>{t("sot.terminiIRadhes").toUpperCase()}</Text>
            <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.mbiAri} />
          </View>
          <Text style={styles.iRadhesOra}>{iRadhes.ora_lokale}</Text>
          <Text style={styles.iRadhesKlienti}>{iRadhes.klienti_emri}</Text>
          <Text style={styles.iRadhesSherbimi}>
            {iRadhes.sherbimi_emri} · {t(`statuset.${iRadhes.statusi}`)}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.iRadhes, styles.iRadhesBosh]}>
          <Text style={styles.iRadhesBoshTeksti}>{t("sot.asnjeIHapur")}</Text>
        </View>
      )}

      <View style={styles.statistikat}>
        <Statistika
          etiketa={t("statuset.ne_pritje")}
          vlera={String(numri("ne_pritje"))}
          ngjyra={statusetMeta.ne_pritje.ngjyra}
          aktiv={filtri === "ne_pritje"}
          onPress={() => setFiltri(filtri === "ne_pritje" ? "te_gjitha" : "ne_pritje")}
        />
        <Statistika
          etiketa={t("statuset.konfirmuar")}
          vlera={String(numri("konfirmuar"))}
          ngjyra={statusetMeta.konfirmuar.ngjyra}
          aktiv={filtri === "konfirmuar"}
          onPress={() => setFiltri(filtri === "konfirmuar" ? "te_gjitha" : "konfirmuar")}
        />
        <Statistika
          etiketa={t("sot.teArdhura")}
          vlera={formatoCmimin(teArdhurat)}
          ngjyra={statusetMeta.perfunduar.ngjyra}
          aktiv={filtri === "perfunduar"}
          onPress={() => setFiltri(filtri === "perfunduar" ? "te_gjitha" : "perfunduar")}
        />
      </View>

      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        <TextInput
          value={kerkimi}
          onChangeText={setKerkimi}
          placeholder={t("sot.kerko")}
          placeholderTextColor={ngjyrat.tekstiZbehte}
          style={styles.kerkimiInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t("sot.kerko")}
        />
        {kerkimi !== "" && (
          <Pressable accessibilityRole="button" onPress={() => setKerkimi("")} hitSlop={10}>
            <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrat}
        style={styles.filtratScroll}
      >
        {(["te_gjitha", ...STATUSET] as Filtri[]).map((f) => {
          const aktiv = filtri === f;
          const sasia = f === "te_gjitha" ? lista.length : numri(f);
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: aktiv }}
              onPress={() => setFiltri(f)}
              style={[styles.chip, aktiv && styles.chipAktiv]}
            >
              <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>
                {f === "te_gjitha" ? t("sot.teGjitha") : t(`statuset.${f}`)}
              </Text>
              <Text style={[styles.chipNumri, aktiv && styles.chipTekstiAktiv]}>{sasia}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.seksioni}>
        {filtri === "te_gjitha" ? t("sot.orariIDites") : t(`statuset.${filtri}`)} · {teFiltruara.length}
      </Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.lista, { paddingTop: insets.top + hapesira.lg, paddingBottom: hapesira.xxl }]}
      data={teFiltruara}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={koka}
      refreshControl={
        <RefreshControl refreshing={terminet.isRefetching} onRefresh={() => void terminet.refetch()} tintColor={ngjyrat.ari} />
      }
      renderItem={({ item }) => <KartaTerminit termini={item} onPress={() => hapTerminin(item.id, data)} />}
      ListEmptyComponent={
        terminet.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : terminet.isError ? (
          <View style={styles.bosh}>
            <Ikona emri={ikonat.gabim} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
            <Text style={styles.boshTeksti}>{t("pergjithshme.gabimPapritur")}</Text>
            <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => terminet.refetch()} />
          </View>
        ) : (
          <View style={styles.bosh}>
            <View style={styles.boshIkona}>
              <Ikona emri={ikonat.bosh} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
            </View>
            <Text style={styles.boshTitulli}>{kaFiltra ? t("sot.asnjePerputhet") : t("sot.paTermine")}</Text>
            <Text style={styles.boshTeksti}>{kaFiltra ? t("sot.provoKerkim") : t("sot.paTermineTeksti")}</Text>
            {kaFiltra ? (
              <Butoni
                titulli={t("sot.pastroFiltrat")}
                varianti="dytesor"
                ikona={ikonat.kthe}
                onPress={() => {
                  setFiltri("te_gjitha");
                  setKerkimi("");
                }}
              />
            ) : (
              <Butoni
                titulli={t("sot.shtoTermin")}
                ikona={ikonat.shto}
                onPress={() => router.push({ pathname: "/shto", params: { data } })}
              />
            )}
          </View>
        )
      }
    />
  );
}

type StatistikaProps = {
  etiketa: string;
  vlera: string;
  ngjyra: string;
  aktiv: boolean;
  onPress: () => void;
};

function Statistika({ etiketa, vlera, ngjyra, aktiv, onPress }: StatistikaProps) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={onPress}
      style={({ pressed }) => [styles.statistika, aktiv && { borderColor: ngjyra }, pressed && styles.shtypur]}
    >
      <View style={[styles.statistikaPika, { backgroundColor: ngjyra }]} />
      <Text style={styles.statistikaVlera}>{vlera}</Text>
      <Text style={styles.statistikaEtiketa}>{etiketa}</Text>
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
      paddingHorizontal: hapesira.xxl,
      gap: hapesira.md,
    },
    lista: {
      paddingHorizontal: hapesira.xl,
    },
    shtypur: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: hapesira.md,
      marginBottom: hapesira.lg,
    },
    kokaTeksti: {
      flex: 1,
      gap: 2,
    },
    data: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "600",
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    kokaButonat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    butoniCilesimet: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    butoniShto: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    ditet: {
      marginBottom: hapesira.lg,
    },
    iRadhes: {
      backgroundColor: ngjyrat.ari,
      borderRadius: rrezja.lg,
      padding: hapesira.xl,
      marginBottom: hapesira.lg,
    },
    iRadhesKoka: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hapesira.sm,
    },
    iRadhesEtiketa: {
      color: ngjyrat.mbiAri,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.2,
      opacity: 0.7,
    },
    iRadhesOra: {
      color: ngjyrat.mbiAri,
      fontSize: 36,
      fontWeight: "800",
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    iRadhesKlienti: {
      color: ngjyrat.mbiAri,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 2,
    },
    iRadhesSherbimi: {
      color: ngjyrat.mbiAri,
      fontSize: 14,
      opacity: 0.75,
      marginTop: 2,
    },
    iRadhesBosh: {
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    iRadhesBoshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
    statistikat: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    statistika: {
      flex: 1,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
    },
    statistikaPika: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: hapesira.sm,
    },
    statistikaVlera: {
      color: ngjyrat.teksti,
      fontSize: 22,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    statistikaEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      paddingHorizontal: hapesira.md,
      height: 48,
      marginBottom: hapesira.md,
    },
    kerkimiInput: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
      height: "100%",
    },
    filtratScroll: {
      marginHorizontal: -hapesira.xl,
      marginBottom: hapesira.lg,
    },
    filtrat: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
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
    chipNumri: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.sfondi,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    ngarkimi: {
      marginTop: hapesira.xl,
    },
    bosh: {
      alignItems: "center",
      paddingVertical: hapesira.xxl,
      gap: hapesira.sm,
    },
    boshIkona: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "700",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      marginBottom: hapesira.md,
    },
  });
