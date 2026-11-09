import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStilet, useTema } from "../context/TemaContext";
import { formatoCmimin } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../theme";
import Butoni from "./Butoni";
import Ikona, { ikonat } from "./Ikona";

// Kategoritë njihen nga serveri sipas emrit të shërbimit (shih sherbimi_ne_kategori).
export const KATEGORITE = ["qethje", "fade", "mjeker", "femije", "ngjyrosje"] as const;
export type Kategoria = (typeof KATEGORITE)[number];
export type Renditja = "distanca" | "cmimi" | "vleresimi";

export type Filtrat = {
  renditja: Renditja;
  sherbimi: Kategoria | null;
  // Në centa.
  cmimiMax: number | null;
  vleresimiMin: number | null;
  // null: qyteti + rrethina; ndryshe vetëm lokalet brenda kaq km nga klienti.
  distancaKm: number | null;
  vetemHapur: boolean;
  vetemOnline: boolean;
  vetemOferta: boolean;
};

export const FILTRAT_FILLESTARE: Filtrat = {
  renditja: "distanca",
  sherbimi: null,
  cmimiMax: null,
  vleresimiMin: null,
  distancaKm: null,
  vetemHapur: false,
  vetemOnline: false,
  vetemOferta: false,
};

// Sa filtra janë aktivë (renditja nuk llogaritet si filtër).
export function numeroFiltrat(f: Filtrat): number {
  return [f.sherbimi, f.cmimiMax, f.vleresimiMin, f.distancaKm].filter((v) => v !== null).length +
    [f.vetemHapur, f.vetemOnline, f.vetemOferta].filter(Boolean).length;
}

const CMIMET = [500, 1000, 1500];
const VLERESIMET = [4, 4.5];
const DISTANCAT = [1, 3, 5, 10];

type Props = {
  iDukshem: boolean;
  filtrat: Filtrat;
  ndrysho: (f: Filtrat) => void;
  numri: number | null;
  onMbyll: () => void;
};

// Fleta e filtrave: çdo ndryshim aplikohet menjëherë, butoni poshtë tregon sa lokale mbeten.
export default function FiltratEKerkimit({ iDukshem, filtrat: f, ndrysho, numri, onMbyll }: Props) {
  const { t, i18n } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const vendos = <K extends keyof Filtrat>(celesi: K, vlera: Filtrat[K]) => ndrysho({ ...f, [celesi]: vlera });

  return (
    <Modal visible={iDukshem} animationType="slide" presentationStyle="pageSheet" onRequestClose={onMbyll}>
      <View style={styles.container}>
        <View style={styles.koka}>
          <Text style={styles.titulli}>{t("zbulo.filtratTitulli")}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("zbulo.mbyll")} onPress={onMbyll} hitSlop={10}>
            <Ikona emri={ikonat.mbyll} madhesia={22} ngjyra={ngjyrat.teksti} />
          </Pressable>
        </View>
        <View style={styles.vijaETrashe} />

        <ScrollView contentContainerStyle={styles.permbajtja}>
          <Seksioni numri="01" titulli={t("zbulo.renditja")}>
            <Opsioni teksti={t("zbulo.meAfer")} aktiv={f.renditja === "distanca"} onPress={() => vendos("renditja", "distanca")} />
            <Opsioni teksti={t("zbulo.meLire")} aktiv={f.renditja === "cmimi"} onPress={() => vendos("renditja", "cmimi")} />
            <Opsioni
              teksti={t("zbulo.meTeVleresuar")}
              aktiv={f.renditja === "vleresimi"}
              onPress={() => vendos("renditja", "vleresimi")}
            />
          </Seksioni>

          <Seksioni numri="02" titulli={t("zbulo.sherbimi")}>
            <Opsioni teksti={t("zbulo.teGjitha")} aktiv={f.sherbimi === null} onPress={() => vendos("sherbimi", null)} />
            {KATEGORITE.map((k) => (
              <Opsioni key={k} teksti={t(`zbulo.k_${k}`)} aktiv={f.sherbimi === k} onPress={() => vendos("sherbimi", k)} />
            ))}
          </Seksioni>

          <Seksioni numri="03" titulli={t("zbulo.cmimi")}>
            <Opsioni teksti={t("zbulo.cdoCmim")} aktiv={f.cmimiMax === null} onPress={() => vendos("cmimiMax", null)} />
            {CMIMET.map((c) => (
              <Opsioni
                key={c}
                teksti={t("zbulo.deriNe", { cmimi: formatoCmimin(c) })}
                aktiv={f.cmimiMax === c}
                onPress={() => vendos("cmimiMax", c)}
              />
            ))}
          </Seksioni>

          <Seksioni numri="04" titulli={t("zbulo.vleresimi")}>
            <Opsioni teksti={t("zbulo.cdoVleresim")} aktiv={f.vleresimiMin === null} onPress={() => vendos("vleresimiMin", null)} />
            {VLERESIMET.map((v) => (
              <Opsioni
                key={v}
                teksti={t("zbulo.yjeELart", { yje: i18n.language === "sq" ? String(v).replace(".", ",") : String(v) })}
                aktiv={f.vleresimiMin === v}
                onPress={() => vendos("vleresimiMin", v)}
              />
            ))}
          </Seksioni>

          <Seksioni numri="05" titulli={t("zbulo.distanca")}>
            <Opsioni teksti={t("zbulo.gjitheZona")} aktiv={f.distancaKm === null} onPress={() => vendos("distancaKm", null)} />
            {DISTANCAT.map((d) => (
              <Opsioni key={d} teksti={t("zbulo.brendaKm", { km: d })} aktiv={f.distancaKm === d} onPress={() => vendos("distancaKm", d)} />
            ))}
          </Seksioni>

          <Seksioni numri="06" titulli={t("zbulo.vetem")}>
            <Opsioni teksti={t("zbulo.hapurTani")} aktiv={f.vetemHapur} onPress={() => vendos("vetemHapur", !f.vetemHapur)} />
            <Opsioni teksti={t("zbulo.online")} aktiv={f.vetemOnline} onPress={() => vendos("vetemOnline", !f.vetemOnline)} />
            <Opsioni teksti={t("zbulo.meOferte")} aktiv={f.vetemOferta} onPress={() => vendos("vetemOferta", !f.vetemOferta)} />
          </Seksioni>
        </ScrollView>

        <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              prekja.lehte();
              ndrysho(FILTRAT_FILLESTARE);
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.pastro, pressed && styles.shtypur]}
          >
            <Text style={styles.pastroTeksti}>{t("zbulo.pastro")}</Text>
          </Pressable>
          <Butoni
            titulli={numri === null ? t("zbulo.shfaqRezultatet") : t("zbulo.shfaq", { numri })}
            onPress={onMbyll}
            style={styles.shfaq}
          />
        </View>
      </View>
    </Modal>
  );
}

function Seksioni({ numri, titulli, children }: { numri: string; titulli: string; children: React.ReactNode }) {
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.seksioni}>
      <View style={styles.seksioniKoka}>
        <Text style={styles.seksioniNumri}>{numri}</Text>
        <Text style={styles.seksioniTitulli}>{titulli}</Text>
      </View>
      <View style={styles.opsionet}>{children}</View>
    </View>
  );
}

export function Opsioni({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={() => {
        prekja.zgjedhje();
        onPress();
      }}
      style={({ pressed }) => [styles.opsioni, aktiv && styles.opsioniAktiv, pressed && styles.shtypur]}
    >
      <Text style={[styles.opsioniTeksti, aktiv && styles.opsioniTekstiAktiv]}>{teksti}</Text>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.xl,
      paddingBottom: hapesira.md,
    },
    titulli: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 32,
      letterSpacing: -0.8,
    },
    vijaETrashe: {
      height: 4,
      backgroundColor: ngjyrat.vija,
      marginHorizontal: hapesira.xl,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    seksioni: {
      borderBottomWidth: 1,
      borderBottomColor: ngjyrat.vija,
      paddingVertical: hapesira.lg,
      gap: hapesira.md,
    },
    seksioniKoka: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: hapesira.sm,
    },
    seksioniNumri: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.theksi,
      fontSize: 12,
      letterSpacing: 1,
    },
    seksioniTitulli: {
      fontFamily: shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 20,
    },
    opsionet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
    },
    opsioni: {
      paddingHorizontal: 12,
      height: 36,
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
      justifyContent: "center",
    },
    opsioniAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    opsioniTeksti: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    opsioniTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    shtypur: {
      opacity: 0.6,
    },
    fundi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1.5,
      borderTopColor: ngjyrat.vija,
    },
    pastro: {
      paddingVertical: 6,
    },
    pastroTeksti: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      textDecorationLine: "underline",
    },
    shfaq: {
      flex: 1,
    },
  });
