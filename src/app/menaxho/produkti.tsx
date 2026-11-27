import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KATEGORITE_E_PRODUKTEVE,
  useFshiProduktin,
  useProduktet,
  useRuajProduktin,
  type KategoriaEProduktit,
  type Produkti,
} from "../../api/dyqani";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import EkraniINgarkimit from "../../components/EkraniINgarkimit";
import FushaTekstit from "../../components/FushaTekstit";
import HyrjaMeRadhe from "../../components/HyrjaMeRadhe";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { lexoCmimin } from "../../lib/formatimi";
import { zgjidhFoton, type Fotoja } from "../../lib/fotot";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

// Shto ose ndrysho një produkt: foto, emri, kategoria, çmimi, stoku, përshkrimi dhe "aktiv".
export default function FormaEProduktit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const produktet = useProduktet();
  if (!produktet.data) return <EkraniINgarkimit pyetjet={[produktet]} />;
  return <Forma produkti={id ? produktet.data.find((p) => p.id === id) : undefined} />;
}

function Forma({ produkti }: { produkti?: Produkti }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const ruaj = useRuajProduktin();
  const fshi = useFshiProduktin();

  const [emri, setEmri] = useState(produkti?.emri ?? "");
  const [cmimi, setCmimi] = useState(produkti ? String(produkti.cmimi_centa / 100).replace(".", ",") : "");
  const [kategoria, setKategoria] = useState<KategoriaEProduktit>(produkti?.kategoria ?? "stilim");
  const [stoku, setStoku] = useState(produkti?.ne_stok != null ? String(produkti.ne_stok) : "");
  const [pershkrimi, setPershkrimi] = useState(produkti?.pershkrimi ?? "");
  const [aktiv, setAktiv] = useState(produkti?.aktiv ?? true);
  const [foto, setFoto] = useState<Fotoja | null>(null);
  const [provuar, setProvuar] = useState(false);
  const [dialogu, setDialogu] = useState(false);
  const [gabimiFotos, setGabimiFotos] = useState<string | null>(null);

  const cmimiCenta = lexoCmimin(cmimi);
  const stokuNumer = stoku.trim() === "" ? null : /^\d{1,5}$/.test(stoku.trim()) ? Number(stoku.trim()) : NaN;
  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("dyqani.gabimEmri"),
    cmimi: cmimiCenta !== null ? null : t("sherbimet.gabimCmimi"),
    stoku: stokuNumer === null || !Number.isNaN(stokuNumer) ? null : t("dyqani.gabimStokuNumer"),
  };

  async function merrFoto(burimi: "kamera" | "galeria") {
    setGabimiFotos(null);
    const e_re = await zgjidhFoton(burimi, [1, 1]);
    if (e_re === "pa_leje") setGabimiFotos(t("portofoli.paLejeKamere"));
    else if (e_re) setFoto(e_re);
  }

  function ruajProduktin() {
    setProvuar(true);
    if (gabimet.emri || gabimet.cmimi || gabimet.stoku || cmimiCenta === null) return;
    ruaj.mutate(
      {
        id: produkti?.id,
        emri: emri.trim(),
        cmimi_centa: cmimiCenta,
        kategoria,
        ne_stok: stokuNumer,
        pershkrimi: pershkrimi.trim() || null,
        aktiv,
        foto,
      },
      { onSuccess: () => router.back() },
    );
  }

  const fotoEShfaqur = foto?.uri ?? produkti?.foto_url ?? null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: t(produkti ? "dyqani.ndryshoProduktin" : "dyqani.produktIRi") }} />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
        <HyrjaMeRadhe>
          <GabimiIFormes mesazhi={gabimiFotos ?? (ruaj.isError || fshi.isError ? t("pergjithshme.gabimPapritur") : null)} />
          <View style={styles.fotoKutia}>
            {fotoEShfaqur ? (
              <Image source={{ uri: fotoEShfaqur }} style={styles.foto} contentFit="contain" />
            ) : (
              <Ikona emri={ikonat.foto} madhesia={34} ngjyra={ngjyrat.tekstiZbehte} />
            )}
          </View>
          <View style={styles.fotoButonat}>
            <Butoni titulli={t("portofoli.bejFoto")} varianti="dytesor" ikona={ikonat.kamera} onPress={() => void merrFoto("kamera")} style={styles.gjysme} />
            <Butoni titulli={t("portofoli.ngaGaleria")} varianti="dytesor" ikona={ikonat.foto} onPress={() => void merrFoto("galeria")} style={styles.gjysme} />
          </View>
          <FushaTekstit
            etiketa={t("dyqani.emri")}
            value={emri}
            onChangeText={setEmri}
            placeholder={t("dyqani.emriShembull")}
            maxLength={80}
            gabimi={provuar ? gabimet.emri : null}
          />
          <Text style={styles.etiketa}>{t("dyqani.kategoria")}</Text>
          <View style={styles.chipet}>
            {KATEGORITE_E_PRODUKTEVE.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ selected: kategoria === k }}
                onPress={() => setKategoria(k)}
                style={[styles.chip, kategoria === k && styles.chipAktiv]}
              >
                <Text style={[styles.chipTeksti, kategoria === k && styles.chipTekstiAktiv]}>{t(`dyqani.kategoria_${k}`)}</Text>
              </Pressable>
            ))}
          </View>
          <FushaTekstit
            etiketa={t("dyqani.cmimi")}
            value={cmimi}
            onChangeText={setCmimi}
            placeholder="12,50"
            keyboardType="decimal-pad"
            gabimi={provuar ? gabimet.cmimi : null}
          />
          <FushaTekstit
            etiketa={t("dyqani.stoku")}
            value={stoku}
            onChangeText={setStoku}
            placeholder={t("dyqani.stokuShembull")}
            keyboardType="number-pad"
            gabimi={provuar ? gabimet.stoku : null}
          />
          <FushaTekstit
            etiketa={t("dyqani.pershkrimi")}
            value={pershkrimi}
            onChangeText={setPershkrimi}
            placeholder={t("dyqani.pershkrimiShembull")}
            maxLength={1000}
            shumeRreshta
          />
          <View style={styles.aktiv}>
            <View style={styles.aktivTeksti}>
              <Text style={styles.aktivTitulli}>{t("dyqani.neDyqan")}</Text>
              <Text style={styles.aktivPershkrimi}>{t("dyqani.neDyqanTeksti")}</Text>
            </View>
            <Switch value={aktiv} onValueChange={setAktiv} trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }} thumbColor="#FFFFFF" />
          </View>
          {produkti ? (
            <Butoni titulli={t("dyqani.fshiProduktin")} varianti="rrezik" ikona={ikonat.fshi} onPress={() => setDialogu(true)} />
          ) : null}
        </HyrjaMeRadhe>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("dyqani.ruaj")} ngarkohet={ruaj.isPending} onPress={ruajProduktin} />
      </View>

      <DialogKonfirmimi
        iDukshem={dialogu}
        titulli={t("dyqani.fshiTitulli")}
        mesazhi={t("dyqani.fshiMesazhi")}
        tekstiKonfirmimit={t("dyqani.fshiProduktin")}
        rrezik
        onAnulo={() => setDialogu(false)}
        onKonfirmo={() => {
          setDialogu(false);
          if (produkti) fshi.mutate(produkti.id, { onSuccess: () => router.back() });
        }}
      />
    </KeyboardAvoidingView>
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
      gap: hapesira.sm,
    },
    fotoKutia: {
      height: 220,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.ariIErret,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    foto: {
      width: "86%",
      height: "86%",
    },
    fotoButonat: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.md,
    },
    gjysme: {
      flex: 1,
    },
    etiketa: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
      marginBottom: hapesira.xs,
    },
    chipet: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    chip: {
      height: 40,
      borderRadius: 20,
      paddingHorizontal: hapesira.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    chipTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 14,
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    aktiv: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginBottom: hapesira.md,
    },
    aktivTeksti: {
      flex: 1,
      gap: 2,
    },
    aktivTitulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    aktivPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
  });
