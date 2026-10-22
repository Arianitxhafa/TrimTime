import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mesazhiIGabimitTeRezervimit, useAnuloTerminin, useTerminetEMia } from "../../api/terminet";
import BadgeStatusi from "../../components/BadgeStatusi";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoDaten } from "../../lib/datat";
import { formatoCmimin } from "../../lib/formatimi";
import { anuloKujtesat, sinkronizoKujtesat } from "../../lib/kujtesat";
import type { TerminiIKlientit } from "../../lib/tipet";
import { lidhjaEUdhezimeve } from "../../lib/vendndodhja";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

type Skeda = "teArdhshme" | "teKaluara";

export default function TerminetEMia() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const terminet = useTerminetEMia();
  const anulo = useAnuloTerminin();
  const [skeda, setSkeda] = useState<Skeda>("teArdhshme");
  const [perTeAnuluar, setPerTeAnuluar] = useState<TerminiIKlientit | null>(null);

  // Një termin është "i ardhshëm" derisa të mbarojë dhe të mos jetë mbyllur. Koha krahasohet
  // me çastin kur u ngarkuan terminet, që lista të mos ndryshojë gjatë vizatimit.
  const tani = terminet.dataUpdatedAt;
  const { teArdhshme, teKaluara } = useMemo(() => {
    const lista = terminet.data ?? [];
    const eArdhshme = (x: TerminiIKlientit) =>
      (x.statusi === "ne_pritje" || x.statusi === "konfirmuar") &&
      new Date(x.fillon_me).getTime() + x.kohezgjatja_min * 60_000 > tani;
    return {
      teArdhshme: lista.filter(eArdhshme).sort((a, b) => a.fillon_me.localeCompare(b.fillon_me)),
      teKaluara: lista.filter((x) => !eArdhshme(x)),
    };
  }, [terminet.data, tani]);

  // Kujtesat ndjekin ndryshimet që bën edhe lokali (zhvendosje, anulim).
  useEffect(() => {
    if (terminet.data) sinkronizoKujtesat(terminet.data, t);
  }, [terminet.data, t]);

  const lista = skeda === "teArdhshme" ? teArdhshme : teKaluara;

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg }]}>
      <Text style={styles.titulli}>{t("tabs.terminet")}</Text>

      <View style={styles.skedat}>
        {(["teArdhshme", "teKaluara"] as const).map((s) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: skeda === s }}
            onPress={() => setSkeda(s)}
            style={[styles.skeda, skeda === s && styles.skedaAktive]}
          >
            <Text style={[styles.skedaTeksti, skeda === s && styles.skedaTekstiAktiv]}>
              {t(`terminetEMia.${s}`)}
              {s === "teArdhshme" && teArdhshme.length > 0 ? ` · ${teArdhshme.length}` : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {anulo.isError && (
        <View style={styles.gabimi}>
          <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(anulo.error, t)} />
        </View>
      )}

      <FlatList
        data={lista}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={{ height: hapesira.md }} />}
        refreshControl={
          <RefreshControl refreshing={terminet.isRefetching} onRefresh={terminet.refetch} tintColor={ngjyrat.ari} />
        }
        renderItem={({ item }) => (
          <KartaETerminit termini={item} iArdhshem={skeda === "teArdhshme"} onAnulo={() => setPerTeAnuluar(item)} />
        )}
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
                <Ikona emri={ikonat.kalendar} madhesia={30} ngjyra={ngjyrat.ari} />
              </View>
              <Text style={styles.boshTitulli}>
                {skeda === "teArdhshme" ? t("terminetEMia.boshTitulli") : t("terminetEMia.boshKaluara")}
              </Text>
              {skeda === "teArdhshme" && (
                <>
                  <Text style={styles.boshTeksti}>{t("terminetEMia.boshTeksti")}</Text>
                  <Butoni titulli={t("terminetEMia.zbulo")} ikona={ikonat.zbulo} onPress={() => router.navigate("/zbulo")} />
                </>
              )}
            </View>
          )
        }
      />

      {perTeAnuluar && (
        <DialogKonfirmimi
          iDukshem
          titulli={t("terminetEMia.anuloTitulli")}
          mesazhi={t("terminetEMia.anuloMesazhi", {
            lokali: perTeAnuluar.lokali_emri,
            data: formatoDaten(perTeAnuluar.data_lokale, t).toLowerCase(),
            ora: perTeAnuluar.ora_lokale,
          })}
          tekstiKonfirmimit={t("terminetEMia.anuloKonfirmo")}
          rrezik
          onAnulo={() => setPerTeAnuluar(null)}
          onKonfirmo={() => {
            const id = perTeAnuluar.id;
            setPerTeAnuluar(null);
            anulo.mutate(id, { onSuccess: () => anuloKujtesat(id) });
          }}
        />
      )}
    </View>
  );
}

type KartaProps = {
  termini: TerminiIKlientit;
  iArdhshem: boolean;
  onAnulo: () => void;
};

function KartaETerminit({ termini, iArdhshem, onAnulo }: KartaProps) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  return (
    <View style={styles.karta}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/lokali/[id]", params: { id: termini.lokali_id } })}
        style={styles.kartaKoka}
      >
        <View style={styles.logo}>
          {termini.lokali_logo_url ? (
            <Image source={{ uri: termini.lokali_logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Text style={styles.logoShkronja}>{termini.lokali_emri.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.kokaTeksti}>
          <Text style={styles.lokali} numberOfLines={1}>
            {termini.lokali_emri}
          </Text>
          <Text style={styles.sherbimi} numberOfLines={1}>
            {termini.sherbimi_emri} · {t("terminetEMia.me", { berberi: termini.berberi_emri.split(" ")[0] })}
          </Text>
        </View>
        <BadgeStatusi statusi={termini.statusi} />
      </Pressable>

      <View style={styles.koha}>
        <View style={styles.kohaPjesa}>
          <Ikona emri={ikonat.kalendar} madhesia={16} ngjyra={ngjyrat.ari} />
          <Text style={styles.kohaTeksti}>{formatoDaten(termini.data_lokale, t)}</Text>
        </View>
        <View style={styles.kohaPjesa}>
          <Ikona emri={ikonat.ora} madhesia={16} ngjyra={ngjyrat.ari} />
          <Text style={styles.kohaTeksti}>{termini.ora_lokale}</Text>
        </View>
        <Text style={styles.cmimi}>{formatoCmimin(termini.cmimi_centa)}</Text>
      </View>

      {iArdhshem ? (
        termini.mund_te_ndryshohet ? (
          <View style={styles.veprimet}>
            <Veprimi ikona={ikonat.anulo} teksti={t("terminetEMia.anulo")} rrezik onPress={onAnulo} />
            <Veprimi
              ikona={ikonat.ora}
              teksti={t("terminetEMia.ndrysho")}
              onPress={() => router.push({ pathname: "/riplanifiko/[id]", params: { id: termini.id } })}
            />
            <Veprimi
              ikona={ikonat.harta}
              teksti={t("terminetEMia.udhezimet")}
              onPress={() => Linking.openURL(lidhjaEUdhezimeve(termini, Platform.OS))}
            />
          </View>
        ) : (
          <View style={styles.veprimet}>
            <Text style={styles.afati}>{t("terminetEMia.afatiKaloi")}</Text>
            <Veprimi
              ikona={ikonat.harta}
              teksti={t("terminetEMia.udhezimet")}
              onPress={() => Linking.openURL(lidhjaEUdhezimeve(termini, Platform.OS))}
            />
          </View>
        )
      ) : (
        <View style={styles.veprimet}>
          <Veprimi
            ikona={ikonat.kthe}
            teksti={t("terminetEMia.rezervoPerseri")}
            onPress={() =>
              router.push({
                pathname: "/rezervo/[lokaliId]",
                params: { lokaliId: termini.lokali_id, sherbimiId: termini.sherbimi_id },
              })
            }
          />
        </View>
      )}
    </View>
  );
}

type VeprimiProps = { ikona: EmriIkones; teksti: string; rrezik?: boolean; onPress: () => void };

function Veprimi({ ikona, teksti, rrezik = false, onPress }: VeprimiProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ngjyra = rrezik ? ngjyrat.rrezik : ngjyrat.teksti;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.veprimi, pressed && styles.shtypur]}
    >
      <Ikona emri={ikona} madhesia={15} ngjyra={ngjyra} />
      <Text style={[styles.veprimiTeksti, { color: ngjyra }]}>{teksti}</Text>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.lg,
    },
    skedat: {
      flexDirection: "row",
      marginHorizontal: hapesira.xl,
      padding: 4,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      marginBottom: hapesira.md,
    },
    skeda: {
      flex: 1,
      height: 38,
      borderRadius: rrezja.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    skedaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    skedaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "700",
    },
    skedaTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    gabimi: {
      paddingHorizontal: hapesira.xl,
    },
    lista: {
      padding: hapesira.xl,
      paddingTop: hapesira.sm,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    kartaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoShkronja: {
      color: ngjyrat.mbiAri,
      fontSize: 20,
      fontWeight: "800",
    },
    kokaTeksti: {
      flex: 1,
      gap: 2,
    },
    lokali: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    sherbimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    koha: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.md,
      paddingHorizontal: hapesira.md,
      paddingVertical: 10,
    },
    kohaPjesa: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    kohaTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    cmimi: {
      marginLeft: "auto",
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "800",
    },
    veprimet: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    veprimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    veprimiTeksti: {
      fontSize: 13,
      fontWeight: "700",
    },
    afati: {
      flex: 1,
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl,
    },
    boshIkona: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      marginBottom: hapesira.md,
      maxWidth: 300,
    },
  });
