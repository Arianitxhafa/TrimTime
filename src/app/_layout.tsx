import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { klientiIQuery } from "../api/klienti";
import { useLokaliIm } from "../api/lokalet";
import KycjaBiometrike from "../components/KycjaBiometrike";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PreferencatProvider, usePreferencat } from "../context/PreferencatContext";
import { ShportaProvider } from "../context/ShportaContext";
import { TemaProvider, useTema } from "../context/TemaContext";
import { useModiAktiv } from "../hooks/useModiAktiv";
import { useNjoftimetEPrekura } from "../hooks/useNjoftimetEPrekura";
import { shkronjat } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Shkronjat janë ato të sistemit (SF Pro në iPhone), si në aplikacionet e Apple: s'ka çfarë të ngarkohet.
  return (
    <TemaProvider>
      <PreferencatProvider>
        <QueryClientProvider client={klientiIQuery}>
          <AuthProvider>
            <ShportaProvider>
              <Navigimi />
            </ShportaProvider>
          </AuthProvider>
        </QueryClientProvider>
      </PreferencatProvider>
    </TemaProvider>
  );
}

function Navigimi() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const { sesioni, ngarkohet, profili, profiliNgarkohet } = useAuth();
  const { onboardingIPare, lejetEPara } = usePreferencat();
  const modi = useModiAktiv();
  // Pas hyrjes duhet ditur nëse llogaria është staf i Studio Burimit, para se të zgjidhen tab-et.
  const lokaliIm = useLokaliIm();
  const pritetRoli = sesioni !== null && (lokaliIm.isPending || profiliNgarkohet);
  const gati = !ngarkohet && !pritetRoli;

  useEffect(() => {
    if (gati) SplashScreen.hideAsync().catch(() => {});
  }, [gati]);

  // Njoftimet hapin ekranin e tyre vetëm pasi përdoruesi ka hyrë dhe ka kaluar lejet.
  useNjoftimetEPrekura(!ngarkohet && sesioni !== null && lejetEPara);

  // Të dhënat e një llogarie nuk duhet t'i shohë llogaria tjetër. Cache-i pastrohet vetëm kur
  // largohet një përdorues që ishte brenda; pas hyrjes do të fshiheshin query-t që sapo kanë nisur.
  const perdoruesiId = sesioni?.user.id;
  const perdoruesiIMeParshem = useRef(perdoruesiId);
  useEffect(() => {
    const iMeParshmi = perdoruesiIMeParshem.current;
    perdoruesiIMeParshem.current = perdoruesiId;
    if (iMeParshmi !== undefined && iMeParshmi !== perdoruesiId) klientiIQuery.clear();
  }, [perdoruesiId]);

  // Splash screen-i mbetet derisa të dihet nëse përdoruesi ka hyrë dhe çfarë roli ka.
  if (!gati) return null;

  const kaHyre = sesioni !== null;
  // Klienti i ri pret aprovimin e Studios; stafi dhe llogaritë para migrimit (statusi null) jo.
  const nePritje = kaHyre && modi === "klient" && (profili?.statusi === "ne_pritje" || profili?.statusi === "refuzuar");

  // Stack.Protected ridrejton nga ekranet që nuk lejohen. Që nga SDK 58, pa `redirectTo` Expo Router
  // shkon te route-i i parë i lejuar; për ekranet e hyrjes ai duhet të jetë "/hyrja".
  const hyrjaPerTeLejuarit = !onboardingIPare ? "/onboarding" : !kaHyre ? "/hyrja" : nePritje ? "/ne-pritje" : "/lejet";
  return (
    <KycjaBiometrike aktive={kaHyre}>
      <StatusBar style={eshteErret ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ngjyrat.sfondi },
          headerTintColor: ngjyrat.ari,
          headerTitleStyle: { color: ngjyrat.teksti, ...shkronjat.titullBold, fontSize: 19 },
          headerShadowVisible: false,
          // Në iOS 26+ SDK 58 i bën header-at transparentë dhe përmbajtja hyn poshtë tyre.
          headerTransparent: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: ngjyrat.sfondi },
        }}
      >
        <Stack.Protected guard={!onboardingIPare} redirectTo={kaHyre ? "/" : "/hyrja"}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && !kaHyre} redirectTo={onboardingIPare ? "/" : "/onboarding"}>
          {/* Hyrja → regjistrimi / verifikimi / rivendosja, në të njëjtin stack. */}
          <Stack.Screen name="hyrja" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="regjistrimi" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="verifiko" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="rivendos" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="rivendos-me-kod" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        {/* Llogaria e re: "Llogaria juaj po kontrollohet" derisa Studio ta aprovojë. */}
        <Stack.Protected guard={onboardingIPare && nePritje} redirectTo={hyrjaPerTeLejuarit === "/ne-pritje" ? "/" : hyrjaPerTeLejuarit}>
          <Stack.Screen name="ne-pritje" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        {/* Pas hyrjes së parë: lejo njoftimet, një herë në këtë telefon. */}
        <Stack.Protected guard={onboardingIPare && kaHyre && !nePritje && !lejetEPara} redirectTo={hyrjaPerTeLejuarit === "/lejet" ? "/" : hyrjaPerTeLejuarit}>
          <Stack.Screen name="lejet" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && kaHyre && !nePritje && lejetEPara} redirectTo={hyrjaPerTeLejuarit}>
          <Stack.Screen name="index" options={{ headerShown: false }} />

          <Stack.Protected guard={modi === "klient"} redirectTo="/sot">
            <Stack.Screen name="(klient)" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="rezervo/[lokaliId]" options={{ title: t("rezervimi.titulli"), presentation: "modal" }} />
            {/* Rezervimi sipas berberit: profili me shërbimet, pastaj orari me statuse. */}
            <Stack.Screen name="rezervo/berberi/[id]" options={{ title: t("rezervimi.profiliIBerberit") }} />
            <Stack.Screen name="rezervo/orari" options={{ title: t("rezervimi.orariTitulli") }} />
            <Stack.Screen name="riplanifiko/[id]" options={{ title: t("terminetEMia.ndryshoTitulli") }} />
            <Stack.Screen name="vlereso/[terminiId]" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="kartat" options={{ title: t("profili.kartat") }} />
            {/* Dyqani: produkti, shporta dhe porositë e mia (merren dhe paguhen në Studio). */}
            <Stack.Screen name="produkti/[id]" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="shporta" options={{ title: t("dyqani.shporta"), presentation: "modal" }} />
            <Stack.Screen name="porosite" options={{ title: t("dyqani.porositeEMia") }} />
          </Stack.Protected>

          <Stack.Protected guard={modi === "biznes"} redirectTo="/ballina">
            <Stack.Screen name="(biznes)" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="termini/[id]" options={{ title: t("termini.titulli") }} />
            <Stack.Screen name="termini/zhvendos" options={{ title: t("zhvendos.titulli"), presentation: "modal" }} />
            <Stack.Screen name="klienti/[celesi]" options={{ title: "" }} />
            <Stack.Screen name="menaxho/analitika" options={{ title: t("analitika.titulli") }} />
            <Stack.Screen name="menaxho/berberi/[id]" options={{ title: t("berberi.orariIm") }} />
            <Stack.Screen name="shto" options={{ title: t("terminIRi.titulli"), presentation: "modal" }} />
            <Stack.Screen name="menaxho/info" options={{ title: t("info.titulli") }} />
            <Stack.Screen name="menaxho/orari" options={{ title: t("orari.titulli") }} />
            <Stack.Screen name="menaxho/sherbimet" options={{ title: t("sherbimet.titulli") }} />
            <Stack.Screen name="menaxho/sherbimi" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="menaxho/stafi" options={{ title: t("stafi.titulli") }} />
            <Stack.Screen name="menaxho/promocionet" options={{ title: t("promocionet.titulli") }} />
            <Stack.Screen name="menaxho/promocioni" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="menaxho/besnikeria" options={{ title: t("besnikeria.titulli") }} />
            <Stack.Screen name="menaxho/portofoli" options={{ title: t("portofoli.titulli") }} />
            <Stack.Screen name="menaxho/qr" options={{ title: t("qr.titulli") }} />
            <Stack.Screen name="menaxho/produktet" options={{ title: t("dyqani.produktet") }} />
            <Stack.Screen name="menaxho/produkti" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="menaxho/porosite" options={{ title: t("dyqani.porosite") }} />
            <Stack.Screen name="menaxho/kodi" options={{ title: t("rivendosja.stafiTitulli"), presentation: "modal" }} />
          </Stack.Protected>

          <Stack.Screen name="lokali/[id]" options={{ title: "" }} />
          {/* Klienti që punon te Studio Burimi bashkohet me kodin e ftesës dhe kalon te pjesa e biznesit. */}
          <Stack.Screen name="bashkohu" options={{ title: "", presentation: "modal" }} />
          <Stack.Screen name="vleresimet/[lokaliId]" options={{ title: t("vleresimet.titulli") }} />
          <Stack.Screen name="skano" options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }} />

          <Stack.Screen name="cilesimet" options={{ title: t("cilesimet.titulli") }} />
          <Stack.Screen name="profili-im" options={{ title: t("profili.teDhenat") }} />
        </Stack.Protected>

        {/* Lidhja e rivendosjes së fjalëkalimit hapet nga email-i, me ose pa sesion. */}
        <Stack.Screen name="fjalekalimi-i-ri" options={{ headerShown: false, animation: "fade" }} />
        {/* Politika e privatësisë: e hapur me ose pa llogari (App Store e kërkon). */}
        <Stack.Screen name="privatesia" options={{ title: t("privatesia.titulli") }} />
      </Stack>
    </KycjaBiometrike>
  );
}
