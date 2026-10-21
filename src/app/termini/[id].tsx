import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/Avatar";
import BadgeStatusi from "../../components/BadgeStatusi";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import { useTerminet } from "../../context/TerminetContext";
import { gjejSherbimin } from "../../data/terminet";
import { hapesira, ngjyrat, rrezja } from "../../theme";

type Dialogu = "anulo" | "fshi" | null;

function kthehu() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

export default function DetajetTerminit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { terminet, ndryshoStatusin, fshiTermin } = useTerminet();
  const [dialogu, setDialogu] = useState<Dialogu>(null);

  const termini = terminet.find((item) => item.id === id);

  if (!termini) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <View style={styles.boshIkona}>
          <Ikona emri={ikonat.anulo} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
        </View>
        <Text style={styles.boshTitulli}>Termini nuk u gjet</Text>
        <Text style={styles.boshTeksti}>Mund të jetë fshirë ose lidhja nuk është e saktë.</Text>
        <Butoni titulli="Kthehu te terminet" ikona={ikonat.kthe} onPress={kthehu} />
      </View>
    );
  }

  const sherbimi = gjejSherbimin(termini.sherbimi);
  const { statusi } = termini;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}
      >
        <View style={styles.hero}>
          <Avatar emri={termini.klienti} madhesia={76} />
          <Text style={styles.emri}>{termini.klienti}</Text>
          <BadgeStatusi statusi={statusi} />
        </View>

        <View style={styles.rrjeta}>
          <Info ikona={ikonat.ora} etiketa="Ora" vlera={termini.ora} />
          <Info
            ikona={ikonat.kohezgjatja}
            etiketa="Kohëzgjatja"
            vlera={sherbimi ? `${sherbimi.kohezgjatja} min` : "—"}
          />
          <Info ikona={ikonat.gershere} etiketa="Shërbimi" vlera={termini.sherbimi} gjere />
          <Info ikona={ikonat.cmimi} etiketa="Çmimi" vlera={sherbimi ? `€${sherbimi.cmimi}` : "—"} />
          <Info ikona={ikonat.telefoni} etiketa="Telefoni" vlera={termini.telefoni ?? "Pa numër"} />
        </View>

        {termini.shenime ? (
          <View style={styles.shenime}>
            <View style={styles.shenimeKoka}>
              <Ikona emri={ikonat.shenime} madhesia={16} ngjyra={ngjyrat.ari} />
              <Text style={styles.shenimeTitulli}>Shënime</Text>
            </View>
            <Text style={styles.shenimeTeksti}>{termini.shenime}</Text>
          </View>
        ) : null}

        <Text style={styles.seksioni}>Veprimet</Text>
        <View style={styles.veprimet}>
          {statusi === "Në pritje" && (
            <Butoni
              titulli="Konfirmo terminin"
              ikona={ikonat.konfirmo}
              onPress={() => ndryshoStatusin(termini.id, "Konfirmuar")}
            />
          )}

          {statusi === "Konfirmuar" && (
            <>
              <Butoni
                titulli="Shëno si të përfunduar"
                ikona={ikonat.perfundo}
                onPress={() => ndryshoStatusin(termini.id, "Përfunduar")}
              />
              <Butoni
                titulli="Kthe në pritje"
                varianti="dytesor"
                ikona={ikonat.kthe}
                onPress={() => ndryshoStatusin(termini.id, "Në pritje")}
              />
            </>
          )}

          {statusi === "Përfunduar" && (
            <Butoni
              titulli="Rikthe si të konfirmuar"
              varianti="dytesor"
              ikona={ikonat.kthe}
              onPress={() => ndryshoStatusin(termini.id, "Konfirmuar")}
            />
          )}

          {statusi === "Anuluar" && (
            <Butoni
              titulli="Rikthe terminin"
              ikona={ikonat.kthe}
              onPress={() => ndryshoStatusin(termini.id, "Në pritje")}
            />
          )}

          {termini.telefoni && (
            <Butoni
              titulli="Telefono klientin"
              varianti="dytesor"
              ikona={ikonat.telefoni}
              onPress={() => Linking.openURL(`tel:${termini.telefoni?.replace(/\s/g, "")}`)}
            />
          )}

          {(statusi === "Në pritje" || statusi === "Konfirmuar") && (
            <Butoni
              titulli="Anulo terminin"
              varianti="rrezik"
              ikona={ikonat.anulo}
              onPress={() => setDialogu("anulo")}
            />
          )}

          <Butoni
            titulli="Fshi terminin"
            varianti="rrezik"
            ikona={ikonat.fshi}
            onPress={() => setDialogu("fshi")}
          />
        </View>
      </ScrollView>

      <DialogKonfirmimi
        iDukshem={dialogu === "anulo"}
        titulli="Anulo terminin?"
        mesazhi={`Termini i ${termini.klienti} në orën ${termini.ora} do të shënohet si i anuluar. Mund ta rikthesh më vonë.`}
        tekstiKonfirmimit="Po, anuloje"
        rrezik
        onAnulo={() => setDialogu(null)}
        onKonfirmo={() => {
          ndryshoStatusin(termini.id, "Anuluar");
          setDialogu(null);
        }}
      />

      <DialogKonfirmimi
        iDukshem={dialogu === "fshi"}
        titulli="Fshi terminin?"
        mesazhi="Ky veprim nuk mund të zhbëhet. Termini do të hiqet përgjithmonë nga lista."
        tekstiKonfirmimit="Po, fshije"
        rrezik
        onAnulo={() => setDialogu(null)}
        onKonfirmo={() => {
          setDialogu(null);
          kthehu();
          fshiTermin(termini.id);
        }}
      />
    </View>
  );
}

type InfoProps = {
  ikona: EmriIkones;
  etiketa: string;
  vlera: string;
  gjere?: boolean;
};

function Info({ ikona, etiketa, vlera, gjere = false }: InfoProps) {
  return (
    <View style={[styles.info, gjere && styles.infoGjere]}>
      <View style={styles.infoIkona}>
        <Ikona emri={ikona} madhesia={16} ngjyra={ngjyrat.ari} />
      </View>
      <Text style={styles.infoEtiketa}>{etiketa}</Text>
      <Text style={styles.infoVlera} numberOfLines={1}>
        {vlera}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ngjyrat.sfondi,
  },
  qendra: {
    alignItems: "center",
    justifyContent: "center",
    padding: hapesira.xxl,
    gap: hapesira.sm,
  },
  permbajtja: {
    padding: hapesira.xl,
  },
  hero: {
    alignItems: "center",
    gap: hapesira.md,
    paddingVertical: hapesira.xl,
  },
  emri: {
    color: ngjyrat.teksti,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  rrjeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: hapesira.sm,
    marginBottom: hapesira.lg,
  },
  info: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.md,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    padding: hapesira.md,
    gap: 4,
  },
  infoGjere: {
    flexBasis: "100%",
  },
  infoIkona: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: ngjyrat.ariIErret,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  infoEtiketa: {
    color: ngjyrat.tekstiZbehte,
    fontSize: 12,
    fontWeight: "600",
  },
  infoVlera: {
    color: ngjyrat.teksti,
    fontSize: 16,
    fontWeight: "700",
  },
  shenime: {
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.md,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    padding: hapesira.lg,
    marginBottom: hapesira.lg,
    gap: hapesira.sm,
  },
  shenimeKoka: {
    flexDirection: "row",
    alignItems: "center",
    gap: hapesira.sm,
  },
  shenimeTitulli: {
    color: ngjyrat.teksti,
    fontSize: 14,
    fontWeight: "700",
  },
  shenimeTeksti: {
    color: ngjyrat.tekstiDyte,
    fontSize: 15,
    lineHeight: 22,
  },
  seksioni: {
    color: ngjyrat.tekstiDyte,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: hapesira.sm,
    marginBottom: hapesira.md,
  },
  veprimet: {
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
    fontSize: 18,
    fontWeight: "700",
  },
  boshTeksti: {
    color: ngjyrat.tekstiDyte,
    fontSize: 14,
    textAlign: "center",
    marginBottom: hapesira.md,
  },
});
