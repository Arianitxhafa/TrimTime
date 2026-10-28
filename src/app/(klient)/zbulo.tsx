import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useLokaletPrane } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaELokalit from "../../components/KartaELokalit";
import { SkeletiIKartes } from "../../components/Skeleti";
import Xham from "../../components/Xham";
import ZgjedhesiIQytetit from "../../components/ZgjedhesiIQytetit";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVonesa } from "../../hooks/useVonesa";
import { useZonaIme } from "../../hooks/useZonaIme";
import { formatoCmimin } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const CMIMI_MAX_FILTRI = 1000;
// Përveç qytetit, shfaqen edhe lokalet brenda kësaj rrezeje nga klienti (lagjet në periferi).
const RREZJA_KM = 10;

function pershendetjaESotme(): "zbulo.mirmengjes" | "zbulo.mirdita" | "zbulo.mirembrema" {
  const ora = new Date().getHours();
  return ora < 11 ? "zbulo.mirmengjes" : ora < 18 ? "zbulo.mirdita" : "zbulo.mirembrema";
}

export default function Zbulo() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { emriIShfaqur } = useAuth();
  const zona = useZonaIme();
  const { pika, kaLeje, kerkoLeje } = zona;
  const [zgjedhesi, setZgjedhesi] = useState(false);

  const [kerkimi, setKerkimi] = useState("");
  const [vetemHapur, setVetemHapur] = useState(false);
  const [renditja, setRenditja] = useState<"distanca" | "cmimi" | "vleresimi">("distanca");
  const [deri10, setDeri10] = useState(false);
  const kerkimiIVonuar = useVonesa(kerkimi);

  const lokalet = useLokaletPrane(
    {
      pika,
      rrezjaKm: RREZJA_KM,
      kerkimi: kerkimiIVonuar,
      vetemHapur,
      cmimiMax: deri10 ? CMIMI_MAX_FILTRI : null,
      renditja,
      qytetiId: zona.qyteti?.id ?? null,
    },
    // Pret derisa të dihet qyteti, që të mos ngarkohen lokalet e një qyteti tjetër.
    zona.gati,
  );

  const kaFiltra = vetemHapur || deri10 || kerkimi.trim() !== "";
  const emriIPare = emriIShfaqur.includes("@") ? "" : emriIShfaqur.split(" ")[0];

  function pastroFiltrat() {
    setKerkimi("");
    setVetemHapur(false);
    setDeri10(false);
    setRenditja("distanca");
  }

  const koka = (
    <View>
      <View style={styles.shiriti}>
        <Text style={styles.pershendetja} numberOfLines={1}>
          {t(pershendetjaESotme())}
          {emriIPare ? `, ${emriIPare}` : ""}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("zona.zgjidhQytetin")}
          onPress={() => {
            prekja.lehte();
            setZgjedhesi(true);
          }}
          hitSlop={6}
        >
          <Xham style={styles.qyteti}>
            <Ikona emri={ikonat.harta} madhesia={14} ngjyra={ngjyrat.ari} />
            <Text style={styles.qytetiTeksti} numberOfLines={1}>
              {zona.qyteti?.emri ?? t("zona.zgjidhQytetin")}
            </Text>
            <Ikona emri={ikonat.djathtas} madhesia={12} ngjyra={ngjyrat.tekstiDyte} />
          </Xham>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("qr.skano")}
          onPress={() => {
            prekja.lehte();
            router.push("/skano");
          }}
          hitSlop={6}
        >
          <Xham style={styles.skano}>
            <Ikona emri={ikonat.skano} madhesia={18} ngjyra={ngjyrat.ari} />
          </Xham>
        </Pressable>
      </View>
      <Text style={styles.titulli}>{t("zbulo.gatiPerLook")}</Text>

      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        <TextInput
          value={kerkimi}
          onChangeText={setKerkimi}
          placeholder={t("zbulo.kerko")}
          placeholderTextColor={ngjyrat.tekstiZbehte}
          style={styles.kerkimiInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t("zbulo.kerko")}
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
        style={styles.filtratScroll}
        contentContainerStyle={styles.filtrat}
      >
        <Chip teksti={t("zbulo.hapurTani")} aktiv={vetemHapur} onPress={() => setVetemHapur(!vetemHapur)} />
        <Chip
          teksti={t("zbulo.deriNe", { cmimi: formatoCmimin(CMIMI_MAX_FILTRI) })}
          aktiv={deri10}
          onPress={() => setDeri10(!deri10)}
        />
        <Chip teksti={t("zbulo.meAfer")} aktiv={renditja === "distanca"} onPress={() => setRenditja("distanca")} />
        <Chip teksti={t("zbulo.meLire")} aktiv={renditja === "cmimi"} onPress={() => setRenditja("cmimi")} />
        <Chip
          teksti={t("zbulo.meTeVleresuar")}
          aktiv={renditja === "vleresimi"}
          onPress={() => setRenditja("vleresimi")}
        />
      </ScrollView>

      {kaLeje === false && !zona.qyteti && (
        <View style={styles.leja}>
          <Ikona emri={ikonat.harta} madhesia={18} ngjyra={ngjyrat.ari} />
          <Text style={styles.lejaTeksti}>{t("zbulo.paLeje")}</Text>
          <Pressable accessibilityRole="button" onPress={kerkoLeje} hitSlop={8}>
            <Text style={styles.lejaButoni}>{t("zbulo.lejoVendndodhjen")}</Text>
          </Pressable>
        </View>
      )}

      {lokalet.data && lokalet.data.length > 0 && (
        <View style={styles.seksioniRreshti}>
          <Text style={styles.seksioni} numberOfLines={1}>
            {zona.qyteti ? t("zona.lokaletNe", { qyteti: zona.qyteti.emri }) : t("tabs.zbulo")}
          </Text>
          <Text style={styles.numri}>{t("zbulo.rezultatet", { numri: lokalet.data.length })}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[ngjyrat.ariIErret, ngjyrat.sfondi]} style={styles.drita} pointerEvents="none" />
      <ZgjedhesiIQytetit
        iDukshem={zgjedhesi}
        qytetiAktual={zona.qyteti?.id ?? null}
        onMbyll={() => setZgjedhesi(false)}
        onVendndodhjaIme={() => void kerkoLeje()}
      />
    <FlatList
      style={styles.lista0}
      contentContainerStyle={[styles.lista, { paddingTop: insets.top + hapesira.lg }]}
      data={lokalet.data ?? []}
      keyExtractor={(l) => l.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={koka}
      ItemSeparatorComponent={() => <View style={{ height: hapesira.xl }} />}
      ListFooterComponent={
        (lokalet.data ?? []).some((l) => l.burimi === "osm") ? (
          <Text style={styles.atribuimi}>{t("pergjithshme.atribuimiOsm")}</Text>
        ) : undefined
      }
      renderItem={({ item }) => <KartaELokalit lokali={item} />}
      refreshControl={
        <RefreshControl refreshing={lokalet.isRefetching} onRefresh={() => void lokalet.refetch()} tintColor={ngjyrat.ari} />
      }
      ListEmptyComponent={
        lokalet.isPending ? (
          <View style={styles.skeletet}>
            <SkeletiIKartes />
            <SkeletiIKartes />
          </View>
        ) : (
          <View style={styles.bosh}>
            <View style={styles.boshIkona}>
              <Ikona emri={lokalet.isError ? ikonat.gabim : ikonat.zbulo} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
            </View>
            <Text style={styles.boshTitulli}>{lokalet.isError ? t("zbulo.gabim") : t("zbulo.asnje")}</Text>
            {!lokalet.isError && <Text style={styles.boshTeksti}>{t("zbulo.asnjeTeksti")}</Text>}
            {lokalet.isError ? (
              <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => lokalet.refetch()} />
            ) : (
              kaFiltra && (
                <Butoni titulli={t("zbulo.pastroFiltrat")} varianti="dytesor" ikona={ikonat.kthe} onPress={pastroFiltrat} />
              )
            )}
          </View>
        )
      }
    />
    </View>
  );
}

function Chip({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={() => {
        prekja.zgjedhje();
        onPress();
      }}
      style={[styles.chip, aktiv && styles.chipAktiv]}
    >
      <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{teksti}</Text>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    drita: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 320,
    },
    lista0: {
      flex: 1,
    },
    lista: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    shiriti: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: hapesira.md,
    },
    pershendetja: {
      flex: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
    qyteti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: 190,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: rrezja.plote,
    },
    skano: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    qytetiTeksti: {
      flexShrink: 1,
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 32,
      fontWeight: "800",
      letterSpacing: -1,
      lineHeight: 38,
      marginTop: hapesira.md,
      marginBottom: hapesira.xl,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      paddingHorizontal: hapesira.lg,
      height: 54,
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
      paddingHorizontal: 14,
      height: 36,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    chipTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    seksioniRreshti: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: hapesira.md,
      marginBottom: hapesira.md,
    },
    numri: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      fontWeight: "600",
    },
    skeletet: {
      gap: hapesira.xl,
    },
    leja: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.ariIErret,
      borderRadius: rrezja.md,
      padding: hapesira.md,
      marginBottom: hapesira.lg,
    },
    lejaTeksti: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 13,
      lineHeight: 18,
    },
    lejaButoni: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "800",
    },
    seksioni: {
      flexShrink: 1,
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    atribuimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      textAlign: "center",
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
