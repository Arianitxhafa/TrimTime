import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLokaletPrane } from "../../../api/lokalet";
import Butoni from "../../../components/Butoni";
import FiltratEKerkimit, {
  FILTRAT_FILLESTARE,
  KATEGORITE,
  numeroFiltrat,
  type Filtrat,
} from "../../../components/FiltratEKerkimit";
import Ikona, { ikonat } from "../../../components/Ikona";
import KartaELokalit from "../../../components/KartaELokalit";
import { SkeletiIKartes } from "../../../components/Skeleti";
import ZgjedhesiIQytetit from "../../../components/ZgjedhesiIQytetit";
import { useAuth } from "../../../context/AuthContext";
import { useStilet, useTema } from "../../../context/TemaContext";
import { useVonesa } from "../../../hooks/useVonesa";
import { useZonaIme } from "../../../hooks/useZonaIme";
import { prekja } from "../../../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../../theme";

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
  const { emriIShfaqur } = useAuth();
  const zona = useZonaIme();
  const { pika, kaLeje, kerkoLeje } = zona;
  const [zgjedhesi, setZgjedhesi] = useState(false);

  const [kerkimi, setKerkimi] = useState("");
  const [filtrat, setFiltrat] = useState<Filtrat>(FILTRAT_FILLESTARE);

  // Nga asistenti ("Gjej berber" te një stil): filtri i shërbimit vendoset vetë. Kontrollohet gjatë
  // vizatimit, që ndryshimi i parametrit të aplikohet menjëherë, pa efekt.
  const { sherbimi: sherbimiNgaParametri } = useLocalSearchParams<{ sherbimi?: string }>();
  const [parametriIFundit, setParametriIFundit] = useState<string | undefined>(undefined);
  if (sherbimiNgaParametri !== parametriIFundit) {
    setParametriIFundit(sherbimiNgaParametri);
    const kategoria = KATEGORITE.find((k) => k === sherbimiNgaParametri);
    if (kategoria) setFiltrat((f) => ({ ...f, sherbimi: kategoria }));
  }
  const [fleta, setFleta] = useState(false);
  const kerkimiIVonuar = useVonesa(kerkimi);
  const nrFiltrave = numeroFiltrat(filtrat);
  const ndrysho = <K extends keyof Filtrat>(celesi: K, vlera: Filtrat[K]) => setFiltrat((f) => ({ ...f, [celesi]: vlera }));

  const lokalet = useLokaletPrane(
    {
      pika,
      rrezjaKm: RREZJA_KM,
      kerkimi: kerkimiIVonuar,
      vetemHapur: filtrat.vetemHapur,
      cmimiMax: filtrat.cmimiMax,
      renditja: filtrat.renditja,
      qytetiId: zona.qyteti?.id ?? null,
      sherbimi: filtrat.sherbimi,
      vleresimiMin: filtrat.vleresimiMin,
      distancaMaxKm: filtrat.distancaKm,
      vetemOnline: filtrat.vetemOnline,
      vetemOferta: filtrat.vetemOferta,
    },
    // Pret derisa të dihet qyteti, që të mos ngarkohen lokalet e një qyteti tjetër.
    zona.gati,
  );

  const kaFiltra = nrFiltrave > 0 || kerkimi.trim() !== "";
  const emriIPare = emriIShfaqur.includes("@") ? "" : emriIShfaqur.split(" ")[0];

  function pastroFiltrat() {
    setKerkimi("");
    setFiltrat(FILTRAT_FILLESTARE);
  }

  // Në iPhone dhe Android kërkimi është shiriti native i header-it; në web mbetet fusha në listë.
  const kerkimNative = Platform.OS !== "web";

  const veprimetEHeaderit = () => (
        <View style={styles.veprimet}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("asistenti.titulli")}
            onPress={() => {
              prekja.lehte();
              router.push("/asistenti");
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.skano, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.asistenti} madhesia={17} ngjyra={ngjyrat.ari} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("zona.zgjidhQytetin")}
            onPress={() => {
              prekja.lehte();
              setZgjedhesi(true);
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.qyteti, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.harta} madhesia={14} ngjyra={ngjyrat.bronzi} />
            <Text style={styles.qytetiTeksti} numberOfLines={1}>
              {zona.qyteti?.emri ?? t("zona.zgjidhQytetin")}
            </Text>
            <Ikona emri={ikonat.poshte} madhesia={12} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("qr.skano")}
            onPress={() => {
              prekja.lehte();
              router.push("/skano");
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.skano, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.skano} madhesia={18} ngjyra={ngjyrat.teksti} />
          </Pressable>
        </View>
  );

  const koka = (
    <View>
      <Text style={styles.pershendetja} numberOfLines={1}>
        {t(pershendetjaESotme())}
        {emriIPare ? `, ${emriIPare}` : ""}
      </Text>
      <Text style={styles.titulli}>
        {t("zbulo.titulliRevistes")}{" "}
        {zona.qyteti ? t("zbulo.titulliQyteti", { qyteti: zona.qyteti.emri }) : t("zbulo.titulliKosova")}
      </Text>

      {!kerkimNative && (
      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
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
          <Pressable accessibilityRole="button" accessibilityLabel={t("zbulo.pastroFiltrat")} onPress={() => setKerkimi("")} hitSlop={10}>
            <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        )}
      </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtratScroll}
        contentContainerStyle={styles.filtrat}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nrFiltrave > 0 ? `${t("zbulo.filtrat")} (${nrFiltrave})` : t("zbulo.filtrat")}
          onPress={() => {
            prekja.lehte();
            setFleta(true);
          }}
          style={({ pressed }) => [styles.chip, styles.filtratButoni, nrFiltrave > 0 && styles.chipAktiv, pressed && styles.shtypur]}
        >
          <Ikona emri={ikonat.filtrat} madhesia={15} ngjyra={nrFiltrave > 0 ? ngjyrat.mbiAri : ngjyrat.teksti} />
          <Text style={[styles.chipTeksti, nrFiltrave > 0 && styles.chipTekstiAktiv]}>
            {nrFiltrave > 0 ? `${t("zbulo.filtrat")} · ${nrFiltrave}` : t("zbulo.filtrat")}
          </Text>
        </Pressable>
        <Chip teksti={t("zbulo.hapurTani")} aktiv={filtrat.vetemHapur} onPress={() => ndrysho("vetemHapur", !filtrat.vetemHapur)} />
        <Chip teksti={t("zbulo.online")} aktiv={filtrat.vetemOnline} onPress={() => ndrysho("vetemOnline", !filtrat.vetemOnline)} />
        <Chip teksti={t("zbulo.meOferte")} aktiv={filtrat.vetemOferta} onPress={() => ndrysho("vetemOferta", !filtrat.vetemOferta)} />
        {KATEGORITE.map((k) => (
          <Chip
            key={k}
            teksti={t(`zbulo.k_${k}`)}
            aktiv={filtrat.sherbimi === k}
            onPress={() => ndrysho("sherbimi", filtrat.sherbimi === k ? null : k)}
          />
        ))}
      </ScrollView>

      {kaLeje === false && !zona.qyteti && (
        <View style={styles.leja}>
          <Text style={styles.lejaTeksti}>{t("zbulo.paLeje")}</Text>
          <Pressable accessibilityRole="button" onPress={kerkoLeje} hitSlop={8}>
            <Text style={styles.lejaButoni}>{t("zbulo.lejoVendndodhjen")} →</Text>
          </Pressable>
        </View>
      )}

      {lokalet.data && lokalet.data.length > 0 && (
        <View style={styles.seksioni}>
          <Text style={styles.seksioniTitulli}>{t("zbulo.neKeteBotim")}</Text>
          <Text style={styles.seksioniTeksti}>{t("zbulo.rezultatet", { numri: lokalet.data.length })}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: veprimetEHeaderit,
          headerSearchBarOptions: kerkimNative
            ? {
                placeholder: t("zbulo.kerko"),
                onChangeText: (e) => setKerkimi(e.nativeEvent.text),
                onCancelButtonPress: () => setKerkimi(""),
                hideWhenScrolling: false,
                autoCapitalize: "none",
                tintColor: ngjyrat.ari,
                textColor: ngjyrat.teksti,
                hintTextColor: ngjyrat.tekstiZbehte,
                headerIconColor: ngjyrat.teksti,
              }
            : undefined,
        }}
      />
      <FiltratEKerkimit
        iDukshem={fleta}
        filtrat={filtrat}
        ndrysho={setFiltrat}
        numri={lokalet.data && !lokalet.isPlaceholderData ? lokalet.data.length : null}
        onMbyll={() => setFleta(false)}
      />
      <ZgjedhesiIQytetit
        iDukshem={zgjedhesi}
        qytetiAktual={zona.qyteti?.id ?? null}
        onMbyll={() => setZgjedhesi(false)}
        onVendndodhjaIme={() => void kerkoLeje()}
      />
      <FlatList
        style={styles.lista0}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.lista}
        data={lokalet.data ?? []}
        keyExtractor={(l) => l.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={koka}
        ItemSeparatorComponent={() => <View style={{ height: hapesira.lg }} />}
        ListFooterComponent={
          (lokalet.data ?? []).some((l) => l.burimi === "osm") ? (
            <Text style={styles.atribuimi}>{t("pergjithshme.atribuimiOsm")}</Text>
          ) : undefined
        }
        renderItem={({ item, index }) => <KartaELokalit lokali={item} indeksi={index} />}
        refreshControl={
          <RefreshControl refreshing={lokalet.isRefetching} onRefresh={() => void lokalet.refetch()} tintColor={ngjyrat.teksti} />
        }
        ListEmptyComponent={
          lokalet.isPending ? (
            <View style={styles.skeletet}>
              <SkeletiIKartes />
              <SkeletiIKartes />
            </View>
          ) : (
            <View style={styles.bosh}>
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
    lista0: {
      flex: 1,
    },
    lista: {
      paddingHorizontal: hapesira.lg,
      paddingTop: hapesira.xs,
      paddingBottom: hapesira.xxl * 3,
    },
    masthead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: hapesira.md,
      paddingBottom: hapesira.lg,
    },
    veprimet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      flexShrink: 1,
    },
    qyteti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      maxWidth: 150,
      paddingHorizontal: 12,
      height: 34,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja2,
    },
    qytetiTeksti: {
      flexShrink: 1,
      ...shkronjat.etikete,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    skano: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ngjyrat.siperfaqja2,
    },
    shtypur: {
      opacity: 0.6,
    },
    pershendetja: {
      ...shkronjat.etikete,
      color: ngjyrat.bronzi,
      fontSize: 15,
    },
    titulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      marginTop: 2,
      marginBottom: hapesira.md,
    },
    titulliKursive: {
      ...shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 34,
      lineHeight: 42,
      letterSpacing: -0.4,
    },
    ornamenti: {
      width: 64,
      borderRadius: 3,
      overflow: "hidden",
      marginTop: hapesira.md,
    },
    hyrja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 23,
      marginTop: hapesira.md,
      marginBottom: hapesira.xl,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.sm + 2,
      paddingHorizontal: hapesira.md,
      height: 40,
      marginBottom: hapesira.md,
    },
    kerkimiInput: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
      height: "100%",
    },
    filtratButoni: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    filtratButoniAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    filtratTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    filtratTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    filtratScroll: {
      marginHorizontal: -hapesira.lg,
      marginBottom: hapesira.lg,
      flexGrow: 0,
    },
    filtrat: {
      paddingHorizontal: hapesira.lg,
      gap: hapesira.sm,
    },
    chip: {
      paddingHorizontal: 14,
      height: 34,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    chipTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    leja: {
      gap: hapesira.sm,
      borderLeftWidth: 3,
      borderLeftColor: ngjyrat.theksi,
      paddingLeft: hapesira.md,
      paddingVertical: 4,
      marginBottom: hapesira.xl,
    },
    lejaTeksti: {
      ...shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 15,
      lineHeight: 21,
    },
    lejaButoni: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.theksi,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    seksioni: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: hapesira.md,
    },
    seksioniTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 22,
      letterSpacing: -0.4,
    },
    seksioniTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    skeletet: {
      gap: hapesira.xl,
    },
    atribuimi: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      letterSpacing: 0.5,
      textAlign: "center",
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      paddingVertical: hapesira.xxl,
      gap: hapesira.md,
    },
    boshTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      textAlign: "center",
    },
    boshTeksti: {
      ...shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: hapesira.md,
      maxWidth: 300,
    },
  });
