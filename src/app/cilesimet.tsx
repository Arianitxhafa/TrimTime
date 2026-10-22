import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ikona, { ikonat, type EmriIkones } from "../components/Ikona";
import { useStilet, useTema, type ZgjedhjaTemes } from "../context/TemaContext";
import { gjuhaAktuale, gjuhet, ndryshoGjuhen, type Gjuha } from "../i18n";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

const opsionetETemes = [
  { vlera: "sistemi", titulli: "cilesimet.temaSistemi", pershkrimi: "cilesimet.temaSistemiPershkrimi", ikona: ikonat.pajisja },
  { vlera: "celet", titulli: "cilesimet.temaCelet", pershkrimi: "cilesimet.temaCeletPershkrimi", ikona: ikonat.dielli },
  { vlera: "erret", titulli: "cilesimet.temaErret", pershkrimi: "cilesimet.temaErretPershkrimi", ikona: ikonat.hena },
] as const satisfies readonly { vlera: ZgjedhjaTemes; titulli: string; pershkrimi: string; ikona: EmriIkones }[];

export default function Cilesimet() {
  const { t } = useTranslation();
  const { zgjedhja, ndryshoZgjedhjen } = useTema();
  const styles = useStilet(krijoStilet);
  // Zgjedhja shfaqet menjëherë; përkthimi i gjithë aplikacionit nis pasi të vizatohet ajo,
  // që prekja të mos presë rivizatimin e të gjitha ekraneve.
  const [gjuha, setGjuha] = useState<Gjuha>(gjuhaAktuale);

  function zgjidhGjuhen(kodi: Gjuha) {
    if (kodi === gjuha) return;
    setGjuha(kodi);
    setTimeout(() => ndryshoGjuhen(kodi), 0);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <Text style={styles.seksioni}>{t("cilesimet.pamja")}</Text>
      <View accessibilityRole="radiogroup" style={styles.grupi}>
        {opsionetETemes.map((opsioni, i) => (
          <RreshtiZgjedhjes
            key={opsioni.vlera}
            ikona={opsioni.ikona}
            titulli={t(opsioni.titulli)}
            pershkrimi={t(opsioni.pershkrimi)}
            aktiv={zgjedhja === opsioni.vlera}
            meKufi={i > 0}
            onPress={() => ndryshoZgjedhjen(opsioni.vlera)}
          />
        ))}
      </View>

      <Text style={[styles.seksioni, styles.seksioniTjeter]}>{t("cilesimet.gjuha")}</Text>
      <View accessibilityRole="radiogroup" style={styles.grupi}>
        {gjuhet.map((g, i) => (
          <RreshtiZgjedhjes
            key={g.kodi}
            ikona={ikonat.gjuha}
            titulli={g.emri}
            aktiv={gjuha === g.kodi}
            meKufi={i > 0}
            onPress={() => zgjidhGjuhen(g.kodi)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

type RreshtiProps = {
  ikona: EmriIkones;
  titulli: string;
  pershkrimi?: string;
  aktiv: boolean;
  meKufi: boolean;
  onPress: () => void;
};

function RreshtiZgjedhjes({ ikona, titulli, pershkrimi, aktiv, meKufi, onPress }: RreshtiProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: aktiv }}
      onPress={onPress}
      style={({ pressed }) => [styles.rreshti, meKufi && styles.rreshtiMeKufi, pressed && styles.shtypur]}
    >
      <View style={[styles.ikona, aktiv && styles.ikonaAktive]}>
        <Ikona emri={ikona} madhesia={18} ngjyra={aktiv ? ngjyrat.mbiAri : ngjyrat.tekstiDyte} />
      </View>
      <View style={styles.teksti}>
        <Text style={styles.titulli}>{titulli}</Text>
        {pershkrimi ? <Text style={styles.pershkrimi}>{pershkrimi}</Text> : null}
      </View>
      <View style={[styles.radio, aktiv && styles.radioAktiv]}>
        {aktiv && <View style={styles.radioPika} />}
      </View>
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
      padding: hapesira.xl,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    seksioniTjeter: {
      marginTop: hapesira.xxl,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    ikona: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    ikonaAktive: {
      backgroundColor: ngjyrat.ari,
    },
    teksti: {
      flex: 1,
      gap: 2,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    pershkrimi: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: ngjyrat.tekstiZbehte,
      alignItems: "center",
      justifyContent: "center",
    },
    radioAktiv: {
      borderColor: ngjyrat.ari,
    },
    radioPika: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: ngjyrat.ari,
    },
  });
