import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import type { IntervaliIOrarit } from "../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

// Java fillon të hënën.
export const RENDI_I_DITEVE = [1, 2, 3, 4, 5, 6, 0] as const;

const ORET = Array.from({ length: 37 }, (_, i) => {
  const minutat = 5 * 60 + i * 30; // 05:00 … 23:00
  return `${String(Math.floor(minutat / 60)).padStart(2, "0")}:${minutat % 60 === 0 ? "00" : "30"}`;
});

export function celesiIDites(dita: number) {
  return `ditet.d${dita}` as `ditet.d${0 | 1 | 2 | 3 | 4 | 5 | 6}`;
}

// Kthen true kur çdo interval është i vlefshëm dhe intervalet e një dite nuk mbivendosen.
export function orariEshteIVlefshem(oraret: IntervaliIOrarit[]): boolean {
  return RENDI_I_DITEVE.every((dita) => {
    const iDites = oraret.filter((o) => o.dita === dita).sort((a, b) => a.hapet.localeCompare(b.hapet));
    return iDites.every((o, i) => o.mbyllet > o.hapet && (i === 0 || iDites[i - 1].mbyllet <= o.hapet));
  });
}

type Props = {
  oraret: IntervaliIOrarit[];
  onNdrysho: (oraret: IntervaliIOrarit[]) => void;
};

type Zgjedhja = { indeksi: number; fusha: "hapet" | "mbyllet" } | null;

export default function RedaktoriIOrarit({ oraret, onNdrysho }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const [zgjedhja, setZgjedhja] = useState<Zgjedhja>(null);

  function ndryshoDiten(dita: number, hapur: boolean) {
    const pa = oraret.filter((o) => o.dita !== dita);
    onNdrysho(hapur ? [...pa, { dita, hapet: "09:00", mbyllet: "19:00" }] : pa);
  }

  function shtoInterval(dita: number) {
    const iFundit = oraret
      .filter((o) => o.dita === dita)
      .sort((a, b) => b.mbyllet.localeCompare(a.mbyllet))[0];
    const fillimi = ORET.find((o) => o > (iFundit?.mbyllet ?? "08:30")) ?? "09:00";
    const fundi = ORET[Math.min(ORET.indexOf(fillimi) + 4, ORET.length - 1)];
    onNdrysho([...oraret, { dita, hapet: fillimi, mbyllet: fundi }]);
  }

  function zgjidhOren(ora: string) {
    if (!zgjedhja) return;
    onNdrysho(oraret.map((o, i) => (i === zgjedhja.indeksi ? { ...o, [zgjedhja.fusha]: ora } : o)));
    setZgjedhja(null);
  }

  const iVlefshem = orariEshteIVlefshem(oraret);

  return (
    <View style={styles.container}>
      {RENDI_I_DITEVE.map((dita) => {
        const intervalet = oraret
          .map((o, indeksi) => ({ ...o, indeksi }))
          .filter((o) => o.dita === dita)
          .sort((a, b) => a.hapet.localeCompare(b.hapet));
        const hapur = intervalet.length > 0;

        return (
          <View key={dita} style={styles.dita}>
            <View style={styles.ditaKoka}>
              <Text style={[styles.ditaEmri, !hapur && styles.zbehur]}>{t(celesiIDites(dita))}</Text>
              {!hapur && <Text style={styles.mbyllur}>{t("orari.mbyllur")}</Text>}
              <Switch
                value={hapur}
                onValueChange={(v) => ndryshoDiten(dita, v)}
                trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t(celesiIDites(dita))}
              />
            </View>

            {intervalet.map((o) => (
              <View key={o.indeksi} style={styles.intervali}>
                <ButoniIOres ora={o.hapet} onPress={() => setZgjedhja({ indeksi: o.indeksi, fusha: "hapet" })} />
                <Text style={styles.vija}>–</Text>
                <ButoniIOres ora={o.mbyllet} onPress={() => setZgjedhja({ indeksi: o.indeksi, fusha: "mbyllet" })} />
                {intervalet.length > 1 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${o.hapet}–${o.mbyllet}`}
                    hitSlop={10}
                    onPress={() => onNdrysho(oraret.filter((_, i) => i !== o.indeksi))}
                    style={styles.hiq}
                  >
                    <Ikona emri={ikonat.pastro} madhesia={20} ngjyra={ngjyrat.tekstiZbehte} />
                  </Pressable>
                )}
              </View>
            ))}

            {hapur && (
              <Pressable accessibilityRole="button" onPress={() => shtoInterval(dita)} hitSlop={6}>
                <Text style={styles.shto}>+ {t("orari.shtoInterval")}</Text>
              </Pressable>
            )}
          </View>
        );
      })}

      {!iVlefshem && <Text style={styles.gabimi}>{t("orari.gabimMbivendosje")}</Text>}

      <Modal visible={zgjedhja !== null} transparent animationType="fade" onRequestClose={() => setZgjedhja(null)}>
        <View style={styles.mbulesa}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setZgjedhja(null)} />
          <View style={styles.dritarja}>
            <Text style={styles.dritarjaTitulli}>{t("orari.zgjidhOren")}</Text>
            <FlatList
              data={ORET}
              keyExtractor={(o) => o}
              numColumns={4}
              columnWrapperStyle={styles.rreshtiOreve}
              renderItem={({ item }) => {
                const aktuale =
                  zgjedhja !== null && oraret[zgjedhja.indeksi]?.[zgjedhja.fusha] === item;
                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => zgjidhOren(item)}
                    style={[styles.ora, aktuale && styles.oraAktuale]}
                  >
                    <Text style={[styles.oraTeksti, aktuale && styles.oraTekstiAktual]}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ButoniIOres({ ora, onPress }: { ora: string; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.butoniIOres, pressed && styles.shtypur]}
    >
      <Text style={styles.butoniIOresTeksti}>{ora}</Text>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      gap: hapesira.sm,
    },
    dita: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
      gap: hapesira.sm,
    },
    ditaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    ditaEmri: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    zbehur: {
      color: ngjyrat.tekstiDyte,
    },
    mbyllur: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      fontWeight: "600",
    },
    intervali: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    vija: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
    },
    butoniIOres: {
      flex: 1,
      height: 42,
      borderRadius: rrezja.sm,
      backgroundColor: ngjyrat.siperfaqja2,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    butoniIOresTeksti: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    shtypur: {
      opacity: 0.8,
    },
    hiq: {
      paddingHorizontal: 2,
    },
    shto: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
      paddingVertical: 2,
    },
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      fontWeight: "600",
    },
    mbulesa: {
      flex: 1,
      backgroundColor: ngjyrat.mbulesa,
      justifyContent: "center",
      padding: hapesira.xl,
    },
    dritarja: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      maxHeight: 420,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
    },
    dritarjaTitulli: {
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: hapesira.md,
    },
    rreshtiOreve: {
      gap: hapesira.sm,
      marginBottom: hapesira.sm,
    },
    ora: {
      flex: 1,
      height: 44,
      borderRadius: rrezja.sm,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    oraAktuale: {
      backgroundColor: ngjyrat.ari,
    },
    oraTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    oraTekstiAktual: {
      color: ngjyrat.mbiAri,
    },
  });
