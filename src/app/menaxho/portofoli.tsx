import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
import { useFshiNgaPortofoli, usePortofoli, useShtoNePortofol } from "../../api/portofoli";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import FushaTekstit from "../../components/FushaTekstit";
import GaleriaEPlote from "../../components/GaleriaEPlote";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { zgjidhFoton, type BurimiIFotos, type Fotoja } from "../../lib/fotot";
import { prekja } from "../../lib/prekja";
import type { FotoEPortofolit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const KOLONAT = 3;

// Portofoli i lokalit: berberi fotografon qethjen, shton përshkrimin dhe e publikon.
export default function Portofoli() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sesioni } = useAuth();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id ?? "";
  const eshtePronar = lokaliIm.data?.roli === "pronar";
  const portofoli = usePortofoli(lokaliId || undefined);
  const shto = useShtoNePortofol(lokaliId);
  const fshi = useFshiNgaPortofoli(lokaliId);

  const [eRe, setERe] = useState<Fotoja | null>(null);
  const [pershkrimi, setPershkrimi] = useState("");
  const [gabimi, setGabimi] = useState<string | null>(null);
  const [hapur, setHapur] = useState<number | null>(null);
  const [perTeFshire, setPerTeFshire] = useState<FotoEPortofolit | null>(null);

  const madhesia = (Math.min(width, 640) - hapesira.xl * 2 - hapesira.sm * (KOLONAT - 1)) / KOLONAT;

  async function merrFoto(burimi: BurimiIFotos) {
    setGabimi(null);
    const rezultati = await zgjidhFoton(burimi).catch(() => null);
    if (rezultati === "pa_leje") {
      setGabimi(t("portofoli.paLejeKamere"));
      return;
    }
    if (rezultati) {
      prekja.lehte();
      setPershkrimi("");
      setERe(rezultati);
    }
  }

  function publiko() {
    if (!eRe) return;
    shto.mutate(
      { foto: eRe, pershkrimi },
      {
        onSuccess: () => {
          prekja.sukses();
          setERe(null);
        },
      },
    );
  }

  const fotot = portofoli.data ?? [];
  const mundTeFshije = (f: FotoEPortofolit) => eshtePronar || f.berberi_id === sesioni?.user.id;
  const fotoEHapur = hapur !== null ? fotot[hapur] : undefined;

  return (
    <View style={styles.container}>
      <FlatList
        data={fotot}
        keyExtractor={(f) => f.id}
        numColumns={KOLONAT}
        contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 120 }]}
        columnWrapperStyle={styles.rreshti}
        ListHeaderComponent={
          <View style={styles.koka}>
            <View style={styles.butonat}>
              <View style={styles.butoni}>
                <Butoni titulli={t("portofoli.bejFoto")} ikona={ikonat.kamera} onPress={() => merrFoto("kamera")} />
              </View>
              <View style={styles.butoni}>
                <Butoni titulli={t("portofoli.ngaGaleria")} varianti="dytesor" ikona={ikonat.foto} onPress={() => merrFoto("galeria")} />
              </View>
            </View>
            <GabimiIFormes mesazhi={gabimi ?? (fshi.isError ? t("pergjithshme.gabimPapritur") : null)} />
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={item.pershkrimi ?? t("portofoli.titulli")}
            onPress={() => setHapur(index)}
          >
            <Image source={{ uri: item.foto_url }} style={[styles.foto, { width: madhesia, height: madhesia * 1.25 }]} contentFit="cover" transition={200} />
          </Pressable>
        )}
        ListEmptyComponent={
          portofoli.isPending ? (
            <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
          ) : (
            <View style={styles.bosh}>
              <View style={styles.boshIkona}>
                <Ikona emri={ikonat.kamera} madhesia={28} ngjyra={ngjyrat.ari} />
              </View>
              <Text style={styles.boshTitulli}>{t("portofoli.bosh")}</Text>
              <Text style={styles.boshTeksti}>{t("portofoli.boshTeksti")}</Text>
            </View>
          )
        }
      />

      <GaleriaEPlote
        key={hapur ?? -1}
        fotot={fotot}
        indeksi={hapur}
        onMbyll={() => setHapur(null)}
        veprimi={
          fotoEHapur && mundTeFshije(fotoEHapur)
            ? {
                teksti: t("portofoli.fshi"),
                onPress: (f) => {
                  setHapur(null);
                  setPerTeFshire(f);
                },
              }
            : undefined
        }
      />

      <DialogKonfirmimi
        iDukshem={perTeFshire !== null}
        titulli={t("portofoli.fshiTitulli")}
        mesazhi={t("portofoli.fshiMesazhi")}
        tekstiKonfirmimit={t("portofoli.fshiKonfirmo")}
        rrezik
        onAnulo={() => setPerTeFshire(null)}
        onKonfirmo={() => {
          if (perTeFshire) fshi.mutate(perTeFshire);
          setPerTeFshire(null);
        }}
      />

      {/* Parapamja para publikimit, me përshkrimin. */}
      <Modal visible={eRe !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setERe(null)}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.parapamja} keyboardShouldPersistTaps="handled">
            {eRe ? <Image source={{ uri: eRe.uri }} style={styles.fotoEMadhe} contentFit="cover" /> : null}
            <FushaTekstit
              etiketa={t("portofoli.pershkrimi")}
              placeholder={t("portofoli.pershkrimiShembull")}
              value={pershkrimi}
              onChangeText={setPershkrimi}
              maxLength={200}
            />
            <GabimiIFormes mesazhi={shto.isError ? t("pergjithshme.gabimPapritur") : null} />
            <Butoni titulli={t("portofoli.ruaj")} ikona={ikonat.konfirmo} ngarkohet={shto.isPending} onPress={publiko} />
            <Butoni titulli={t("pergjithshme.anulo")} varianti="dytesor" onPress={() => setERe(null)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
      width: "100%",
      maxWidth: 640,
      alignSelf: "center",
    },
    koka: {
      gap: hapesira.md,
      marginBottom: hapesira.lg,
    },
    butonat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    butoni: {
      flex: 1,
    },
    rreshti: {
      gap: hapesira.sm,
      marginBottom: hapesira.sm,
    },
    foto: {
      borderRadius: rrezja.sm,
      backgroundColor: ngjyrat.siperfaqja2,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl,
    },
    boshIkona: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      maxWidth: 300,
    },
    parapamja: {
      padding: hapesira.xl,
      gap: hapesira.md,
    },
    fotoEMadhe: {
      width: "100%",
      aspectRatio: 4 / 5,
      borderRadius: rrezja.lg,
      marginBottom: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja2,
    },
  });
