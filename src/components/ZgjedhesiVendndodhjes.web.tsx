import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import type { Koordinata } from "../lib/tipet";
import { gjejAdresen, merrVendndodhjen, type AdresaEGjetur } from "../lib/vendndodhja";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Butoni from "./Butoni";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  vlera: Koordinata;
  onNdrysho: (k: Koordinata) => void;
  onAdresa?: (a: AdresaEGjetur) => void;
};

// react-native-maps nuk punon në web; këtu përdoret vendndodhja e shfletuesit.
export default function ZgjedhesiVendndodhjes({ vlera, onNdrysho, onAdresa }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const [kerkohet, setKerkohet] = useState(false);
  const [zgjedhur, setZgjedhur] = useState(false);

  async function perdorVendndodhjen() {
    setKerkohet(true);
    const k = await merrVendndodhjen().catch(() => null);
    setKerkohet(false);
    if (!k) return;
    onNdrysho(k);
    setZgjedhur(true);
    const adresa = onAdresa ? await gjejAdresen(k) : null;
    if (adresa && onAdresa) onAdresa(adresa);
  }

  return (
    <View style={styles.container}>
      <View style={styles.kutia}>
        <Ikona emri={ikonat.harta} madhesia={22} ngjyra={ngjyrat.ari} />
        <Text style={styles.teksti}>
          {zgjedhur
            ? `${t("wizard.vendndodhjaZgjedhur")} · ${vlera.lat.toFixed(5)}, ${vlera.lng.toFixed(5)}`
            : t("wizard.vendndodhjaWeb")}
        </Text>
      </View>
      <Butoni
        titulli={t("wizard.perdorVendndodhjen")}
        varianti="dytesor"
        ikona={ikonat.harta}
        ngarkohet={kerkohet}
        onPress={perdorVendndodhjen}
      />
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      gap: hapesira.md,
      marginBottom: hapesira.lg,
    },
    kutia: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.ariIErret,
      borderRadius: rrezja.lg,
      padding: hapesira.lg,
    },
    teksti: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 14,
      lineHeight: 20,
    },
  });
