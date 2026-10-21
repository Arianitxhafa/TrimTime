import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import KartaTerminit from "../components/KartaTerminit";
import { useTerminet } from "../context/TerminetContext";
import { gjejSherbimin, statuset, type StatusiTerminit } from "../data/terminet";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";

type Filtri = "Të gjitha" | StatusiTerminit;

const ditet = ["E diel", "E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë"];
const muajt = [
  "janar", "shkurt", "mars", "prill", "maj", "qershor",
  "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor",
];

function dataESotme(): string {
  const sot = new Date();
  return `${ditet[sot.getDay()]}, ${sot.getDate()} ${muajt[sot.getMonth()]}`;
}

function hapTerminin(id: string) {
  router.push({ pathname: "/termini/[id]", params: { id } });
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const { terminet } = useTerminet();
  const [filtri, setFiltri] = useState<Filtri>("Të gjitha");
  const [kerkimi, setKerkimi] = useState("");

  const numri = (statusi: StatusiTerminit) => terminet.filter((t) => t.statusi === statusi).length;

  const teArdhurat = terminet
    .filter((t) => t.statusi === "Përfunduar")
    .reduce((shuma, t) => shuma + (gjejSherbimin(t.sherbimi)?.cmimi ?? 0), 0);

  const iRadhes = terminet.find((t) => t.statusi === "Konfirmuar" || t.statusi === "Në pritje");

  const teFiltruara = useMemo(() => {
    const k = kerkimi.trim().toLowerCase();
    return terminet.filter(
      (t) =>
        (filtri === "Të gjitha" || t.statusi === filtri) &&
        (k === "" || t.klienti.toLowerCase().includes(k) || t.sherbimi.toLowerCase().includes(k)),
    );
  }, [terminet, filtri, kerkimi]);

  const kaFiltra = filtri !== "Të gjitha" || kerkimi.trim() !== "";

  const koka = (
    <View>
      <View style={styles.koka}>
        <View style={styles.kokaTeksti}>
          <Text style={styles.data}>{dataESotme()}</Text>
          <Text style={styles.titulli}>TrimTime</Text>
        </View>
        <View style={styles.kokaButonat}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cilësimet"
            onPress={() => router.push("/cilesimet")}
            style={({ pressed }) => [styles.butoniCilesimet, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.cilesimet} madhesia={20} ngjyra={ngjyrat.teksti} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shto termin të ri"
            onPress={() => router.push("/shto")}
            style={({ pressed }) => [styles.butoniShto, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.shto} madhesia={22} ngjyra={ngjyrat.mbiAri} />
          </Pressable>
        </View>
      </View>

      {iRadhes ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => hapTerminin(iRadhes.id)}
          style={({ pressed }) => [styles.iRadhes, pressed && styles.shtypur]}
        >
          <View style={styles.iRadhesKoka}>
            <Text style={styles.iRadhesEtiketa}>TERMINI I RADHËS</Text>
            <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.mbiAri} />
          </View>
          <Text style={styles.iRadhesOra}>{iRadhes.ora}</Text>
          <Text style={styles.iRadhesKlienti}>{iRadhes.klienti}</Text>
          <Text style={styles.iRadhesSherbimi}>
            {iRadhes.sherbimi} · {iRadhes.statusi}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.iRadhes, styles.iRadhesBosh]}>
          <Text style={styles.iRadhesBoshTeksti}>Nuk ka termine të hapura për sot 🎉</Text>
        </View>
      )}

      <View style={styles.statistikat}>
        <Statistika
          etiketa="Në pritje"
          vlera={String(numri("Në pritje"))}
          ngjyra={statusetMeta["Në pritje"].ngjyra}
          aktiv={filtri === "Në pritje"}
          onPress={() => setFiltri(filtri === "Në pritje" ? "Të gjitha" : "Në pritje")}
        />
        <Statistika
          etiketa="Konfirmuar"
          vlera={String(numri("Konfirmuar"))}
          ngjyra={statusetMeta.Konfirmuar.ngjyra}
          aktiv={filtri === "Konfirmuar"}
          onPress={() => setFiltri(filtri === "Konfirmuar" ? "Të gjitha" : "Konfirmuar")}
        />
        <Statistika
          etiketa="Të ardhura"
          vlera={`€${teArdhurat}`}
          ngjyra={statusetMeta.Përfunduar.ngjyra}
          aktiv={filtri === "Përfunduar"}
          onPress={() => setFiltri(filtri === "Përfunduar" ? "Të gjitha" : "Përfunduar")}
        />
      </View>

      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        <TextInput
          value={kerkimi}
          onChangeText={setKerkimi}
          placeholder="Kërko klientin ose shërbimin"
          placeholderTextColor={ngjyrat.tekstiZbehte}
          style={styles.kerkimiInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {kerkimi !== "" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pastro kërkimin"
            onPress={() => setKerkimi("")}
            hitSlop={10}
          >
            <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrat}
        style={styles.filtratScroll}
      >
        {(["Të gjitha", ...statuset] as Filtri[]).map((f) => {
          const aktiv = filtri === f;
          const sasia = f === "Të gjitha" ? terminet.length : numri(f);
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: aktiv }}
              onPress={() => setFiltri(f)}
              style={[styles.chip, aktiv && styles.chipAktiv]}
            >
              <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{f}</Text>
              <Text style={[styles.chipNumri, aktiv && styles.chipTekstiAktiv]}>{sasia}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.seksioni}>
        {filtri === "Të gjitha" ? "Orari i ditës" : filtri} · {teFiltruara.length}
      </Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.lista,
        { paddingTop: insets.top + hapesira.lg, paddingBottom: insets.bottom + hapesira.xxl },
      ]}
      data={teFiltruara}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={koka}
      renderItem={({ item }) => <KartaTerminit termini={item} onPress={() => hapTerminin(item.id)} />}
      ListEmptyComponent={
        <View style={styles.bosh}>
          <View style={styles.boshIkona}>
            <Ikona emri={ikonat.bosh} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
          </View>
          <Text style={styles.boshTitulli}>
            {kaFiltra ? "Asnjë termin nuk përputhet" : "Nuk ka termine ende"}
          </Text>
          <Text style={styles.boshTeksti}>
            {kaFiltra
              ? "Provo një kërkim tjetër ose hiq filtrat."
              : "Shto terminin e parë për ta nisur ditën."}
          </Text>
          {kaFiltra ? (
            <Butoni
              titulli="Pastro filtrat"
              varianti="dytesor"
              ikona={ikonat.kthe}
              onPress={() => {
                setFiltri("Të gjitha");
                setKerkimi("");
              }}
            />
          ) : (
            <Butoni titulli="Shto termin" ikona={ikonat.shto} onPress={() => router.push("/shto")} />
          )}
        </View>
      }
    />
  );
}

type StatistikaProps = {
  etiketa: string;
  vlera: string;
  ngjyra: string;
  aktiv: boolean;
  onPress: () => void;
};

function Statistika({ etiketa, vlera, ngjyra, aktiv, onPress }: StatistikaProps) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.statistika,
        aktiv && { borderColor: ngjyra },
        pressed && styles.shtypur,
      ]}
    >
      <View style={[styles.statistikaPika, { backgroundColor: ngjyra }]} />
      <Text style={styles.statistikaVlera}>{vlera}</Text>
      <Text style={styles.statistikaEtiketa}>{etiketa}</Text>
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
  },
  shtypur: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  koka: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hapesira.xl,
  },
  kokaTeksti: {
    gap: 2,
  },
  data: {
    color: ngjyrat.tekstiDyte,
    fontSize: 14,
    fontWeight: "600",
  },
  titulli: {
    color: ngjyrat.teksti,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kokaButonat: {
    flexDirection: "row",
    gap: hapesira.sm,
  },
  butoniCilesimet: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ngjyrat.siperfaqja,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    alignItems: "center",
    justifyContent: "center",
  },
  butoniShto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ngjyrat.ari,
    alignItems: "center",
    justifyContent: "center",
  },
  iRadhes: {
    backgroundColor: ngjyrat.ari,
    borderRadius: rrezja.lg,
    padding: hapesira.xl,
    marginBottom: hapesira.lg,
  },
  iRadhesKoka: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hapesira.sm,
  },
  iRadhesEtiketa: {
    color: ngjyrat.mbiAri,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    opacity: 0.7,
  },
  iRadhesOra: {
    color: ngjyrat.mbiAri,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  iRadhesKlienti: {
    color: ngjyrat.mbiAri,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  iRadhesSherbimi: {
    color: ngjyrat.mbiAri,
    fontSize: 14,
    opacity: 0.75,
    marginTop: 2,
  },
  iRadhesBosh: {
    backgroundColor: ngjyrat.siperfaqja,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
  },
  iRadhesBoshTeksti: {
    color: ngjyrat.tekstiDyte,
    fontSize: 15,
    fontWeight: "600",
  },
  statistikat: {
    flexDirection: "row",
    gap: hapesira.sm,
    marginBottom: hapesira.lg,
  },
  statistika: {
    flex: 1,
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.md,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    padding: hapesira.md,
  },
  statistikaPika: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: hapesira.sm,
  },
  statistikaVlera: {
    color: ngjyrat.teksti,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statistikaEtiketa: {
    color: ngjyrat.tekstiDyte,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
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
    height: 48,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: rrezja.plote,
    backgroundColor: ngjyrat.siperfaqja,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
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
  chipNumri: {
    color: ngjyrat.tekstiZbehte,
    fontSize: 12,
    fontWeight: "700",
  },
  chipTekstiAktiv: {
    color: ngjyrat.sfondi,
  },
  seksioni: {
    color: ngjyrat.tekstiDyte,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: hapesira.md,
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
