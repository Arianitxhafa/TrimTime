import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLokali } from "../../api/lokalet";
import { useOrari } from "../../api/orari";
import { usePortofoli } from "../../api/portofoli";
import { useSherbimet } from "../../api/sherbimet";
import { useHapUdhezimet } from "../../api/udhezimet";
import { useVleresimetELokalit } from "../../api/vleresimet";
import GaleriaEPlote from "../../components/GaleriaEPlote";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import KartaEVleresimit from "../../components/KartaEVleresimit";
import KopertinaELokalit from "../../components/KopertinaELokalit";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoCmimin } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

// Fleta që ngjitet mbi hartë kur preket një berber, si te Apple Maps: foto, vlerësime, punime,
// orari i sotëm dhe veprimet (Rezervo, Thirr, Udhëzimet, Profili).
export default function LokaliNeHarte() {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const { id } = useLocalSearchParams<{ id: string }>();
  const lokali = useLokali(id);
  const sherbimet = useSherbimet(id);
  const orari = useOrari(id);
  const portofoli = usePortofoli(id);
  const vleresimet = useVleresimetELokalit(id);
  const hapUdhezimet = useHapUdhezimet();
  const [fotoEHapur, setFotoEHapur] = useState<number | null>(null);

  const l = lokali.data;
  if (!l) return <View style={styles.container} />;

  const ngaKatalogu = l.burimi !== "trimtime";
  const sherbimetAktive = (sherbimet.data ?? []).filter((s) => s.aktiv);
  const mundTeRezervoje = !ngaKatalogu && sherbimetAktive.length > 0;
  const kaVleresim = l.vleresimi_mesatar != null && l.nr_vleresimeve > 0;
  const fotot = portofoli.data ?? [];
  const teFundit = vleresimet.data?.pages[0]?.slice(0, 3) ?? [];

  const sot = new Date().getDay();
  const intervaletESotme = (orari.data ?? []).filter((o) => o.dita === sot);
  const kaOrar = (orari.data ?? []).length > 0;
  const orariISotem = !kaOrar
    ? t("harta.paOrar")
    : intervaletESotme.length === 0
      ? t("harta.mbyllurSot")
      : `${t("harta.sot")} ${intervaletESotme.map((o) => `${o.hapet.slice(0, 5)}–${o.mbyllet.slice(0, 5)}`).join(", ")}`;

  function veprimi(fn: () => void) {
    return () => {
      prekja.lehte();
      fn();
    };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <View style={styles.koka}>
        <KopertinaELokalit emri={l.emri} fotoUrl={l.kopertina_url} style={styles.kopertina} />
        <View style={styles.kokaTeksti}>
          <Text style={styles.emri} numberOfLines={2}>
            {l.emri}
          </Text>
          <Text style={styles.adresa} numberOfLines={2}>
            {l.adresa}, {l.qyteti}
          </Text>
          <View style={styles.rreshti}>
            {kaVleresim ? (
              <Text style={styles.vleresimi}>
                ★ {Number(l.vleresimi_mesatar).toFixed(1).replace(".", ",")}{" "}
                <Text style={styles.zbehte}>({l.nr_vleresimeve})</Text>
              </Text>
            ) : null}
            {kaOrar ? (
              <View style={[styles.pika, { backgroundColor: l.i_hapur_tani ? statusetMeta.konfirmuar.ngjyra : ngjyrat.tekstiZbehte }]} />
            ) : null}
            <Text style={styles.zbehte} numberOfLines={1}>
              {orariISotem}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.veprimet}>
        {mundTeRezervoje ? (
          <Veprimi
            ikona={ikonat.kalendar}
            teksti={t("profiliLokalit.rezervo")}
            kryesor
            onPress={veprimi(() =>
              router.push({ pathname: "/rezervo/[lokaliId]", params: { lokaliId: l.id } }),
            )}
          />
        ) : null}
        {!mundTeRezervoje && l.telefoni ? (
          <Veprimi
            ikona={ikonat.kalendar}
            teksti={t("harta.kerkoTermin")}
            kryesor
            onPress={veprimi(() =>
              router.push({ pathname: "/kerko-termin/[lokaliId]", params: { lokaliId: l.id } }),
            )}
          />
        ) : null}
        {l.telefoni ? (
          <Veprimi
            ikona={ikonat.telefoni}
            teksti={t("profiliLokalit.thirr")}
            onPress={veprimi(() => void Linking.openURL(`tel:${l.telefoni?.replace(/\s/g, "")}`))}
          />
        ) : null}
        <Veprimi
          ikona={ikonat.harta}
          teksti={t("profiliLokalit.udhezimet")}
          kryesor={!mundTeRezervoje && !l.telefoni}
          onPress={veprimi(() => {
            router.back();
            hapUdhezimet(l);
          })}
        />
        <Veprimi
          ikona={ikonat.lokali}
          teksti={t("harta.profili")}
          onPress={veprimi(() => router.push({ pathname: "/lokali/[id]", params: { id: l.id } }))}
        />
      </View>

      {mundTeRezervoje && l.cmimi_min !== null ? (
        <Text style={styles.cmimi}>{t("lokali.ngaCmimi", { cmimi: formatoCmimin(l.cmimi_min) })}</Text>
      ) : null}

      {fotot.length > 0 ? (
        <>
          <Text style={styles.seksioni}>{t("portofoli.punimet")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotot}>
            {fotot.slice(0, 12).map((f, i) => (
              <Pressable key={f.id} accessibilityRole="imagebutton" onPress={() => setFotoEHapur(i)}>
                <Image source={{ uri: f.foto_url }} style={styles.foto} contentFit="cover" transition={200} />
              </Pressable>
            ))}
          </ScrollView>
          <GaleriaEPlote key={fotoEHapur ?? -1} fotot={fotot} indeksi={fotoEHapur} onMbyll={() => setFotoEHapur(null)} />
        </>
      ) : null}

      {!ngaKatalogu ? (
        <>
          <Text style={styles.seksioni}>{t("vleresimet.titulli")}</Text>
          {teFundit.length === 0 ? (
            <Text style={styles.zbehte}>{vleresimet.isPending ? " " : t("vleresimet.paVleresime")}</Text>
          ) : (
            <View style={styles.vleresimet}>
              {teFundit.map((v) => (
                <KartaEVleresimit key={v.id} vleresimi={v} />
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.atribuimi}>
          {l.burimi === "numrat" ? t("pergjithshme.atribuimiNumrat") : t("pergjithshme.atribuimiOsm")}
        </Text>
      )}
    </ScrollView>
  );
}

function Veprimi({
  ikona,
  teksti,
  kryesor = false,
  onPress,
}: {
  ikona: EmriIkones;
  teksti: string;
  kryesor?: boolean;
  onPress: () => void;
}) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={teksti}
      onPress={onPress}
      style={({ pressed }) => [styles.veprimi, kryesor && styles.veprimiKryesor, pressed && styles.shtypur]}
    >
      <Ikona emri={ikona} madhesia={19} ngjyra={kryesor ? ngjyrat.mbiAri : ngjyrat.portokalli} />
      <Text style={[styles.veprimiTeksti, kryesor && styles.veprimiTekstiKryesor]} numberOfLines={1}>
        {teksti}
      </Text>
    </Pressable>
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
      paddingTop: hapesira.xl,
      gap: hapesira.md,
      paddingBottom: hapesira.xxl * 2,
    },
    koka: {
      flexDirection: "row",
      gap: hapesira.md,
      alignItems: "center",
    },
    kopertina: {
      width: 84,
      height: 84,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
    },
    kokaTeksti: {
      flex: 1,
      gap: 3,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 22,
      letterSpacing: -0.4,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    vleresimi: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 14,
    },
    zbehte: {
      flexShrink: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    pika: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    veprimet: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    veprimi: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      height: 62,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja,
    },
    veprimiKryesor: {
      backgroundColor: ngjyrat.portokalli,
    },
    shtypur: {
      opacity: 0.7,
    },
    veprimiTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.teksti,
      fontSize: 12,
    },
    veprimiTekstiKryesor: {
      color: ngjyrat.mbiAri,
    },
    cmimi: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    seksioni: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
      marginTop: hapesira.sm,
    },
    fotot: {
      gap: hapesira.sm,
    },
    foto: {
      width: 110,
      height: 140,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja2,
    },
    vleresimet: {
      gap: hapesira.sm,
    },
    atribuimi: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      marginTop: hapesira.sm,
    },
  });
