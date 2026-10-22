import { useState } from "react";
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
import { useLokaletPrane } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaELokalit from "../../components/KartaELokalit";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVendndodhjaIme } from "../../hooks/useVendndodhjaIme";
import { useVonesa } from "../../hooks/useVonesa";
import { formatoCmimin } from "../../lib/formatimi";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const CMIMI_MAX_FILTRI = 1000;
const RREZJA_KM = 30;

export default function Zbulo() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { emriIShfaqur } = useAuth();
  const { pika, kaLeje, kerkoLeje } = useVendndodhjaIme();

  const [kerkimi, setKerkimi] = useState("");
  const [vetemHapur, setVetemHapur] = useState(false);
  const [meLire, setMeLire] = useState(false);
  const [deri10, setDeri10] = useState(false);
  const kerkimiIVonuar = useVonesa(kerkimi);

  const lokalet = useLokaletPrane(
    {
      pika,
      rrezjaKm: RREZJA_KM,
      kerkimi: kerkimiIVonuar,
      vetemHapur,
      cmimiMax: deri10 ? CMIMI_MAX_FILTRI : null,
      renditja: meLire ? "cmimi" : "distanca",
    },
    // Pret derisa të dihet vendndodhja, që të mos bëhen dy kërkesa.
    kaLeje !== null,
  );

  const kaFiltra = vetemHapur || deri10 || kerkimi.trim() !== "";
  const emriIPare = emriIShfaqur.includes("@") ? "" : emriIShfaqur.split(" ")[0];

  function pastroFiltrat() {
    setKerkimi("");
    setVetemHapur(false);
    setDeri10(false);
    setMeLire(false);
  }

  const koka = (
    <View>
      <Text style={styles.pershendetja}>
        {emriIPare ? t("zbulo.pershendetje", { emri: emriIPare }) : t("zbulo.pershendetjePaEmer")}
      </Text>
      <Text style={styles.titulli}>{t("zbulo.pyetja")}</Text>

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
        <Chip teksti={t("zbulo.meAfer")} aktiv={!meLire} onPress={() => setMeLire(false)} />
        <Chip teksti={t("zbulo.meLire")} aktiv={meLire} onPress={() => setMeLire(true)} />
      </ScrollView>

      {kaLeje === false && (
        <View style={styles.leja}>
          <Ikona emri={ikonat.harta} madhesia={18} ngjyra={ngjyrat.ari} />
          <Text style={styles.lejaTeksti}>{t("zbulo.paLeje")}</Text>
          <Pressable accessibilityRole="button" onPress={kerkoLeje} hitSlop={8}>
            <Text style={styles.lejaButoni}>{t("zbulo.lejoVendndodhjen")}</Text>
          </Pressable>
        </View>
      )}

      {lokalet.data && lokalet.data.length > 0 && (
        <Text style={styles.seksioni}>{t("zbulo.rezultatet", { numri: lokalet.data.length })}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.lista, { paddingTop: insets.top + hapesira.lg }]}
      data={lokalet.data ?? []}
      keyExtractor={(l) => l.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={koka}
      ItemSeparatorComponent={() => <View style={{ height: hapesira.lg }} />}
      ListFooterComponent={
        (lokalet.data ?? []).some((l) => l.burimi === "osm") ? (
          <Text style={styles.atribuimi}>{t("pergjithshme.atribuimiOsm")}</Text>
        ) : null
      }
      renderItem={({ item }) => <KartaELokalit lokali={item} />}
      refreshControl={
        <RefreshControl refreshing={lokalet.isRefetching} onRefresh={lokalet.refetch} tintColor={ngjyrat.ari} />
      }
      ListEmptyComponent={
        lokalet.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
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
  );
}

function Chip({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={onPress}
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
    lista: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    pershendetja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.6,
      marginTop: 2,
      marginBottom: hapesira.lg,
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
      height: 50,
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
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
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
