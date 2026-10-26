import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { klientiIQuery } from "../api/klienti";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PreferencatProvider, usePreferencat } from "../context/PreferencatContext";
import { TemaProvider, useTema } from "../context/TemaContext";
import { useModiAktiv } from "../hooks/useModiAktiv";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <TemaProvider>
      <PreferencatProvider>
        <QueryClientProvider client={klientiIQuery}>
          <AuthProvider>
            <Navigimi />
          </AuthProvider>
        </QueryClientProvider>
      </PreferencatProvider>
    </TemaProvider>
  );
}

function Navigimi() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const { sesioni, ngarkohet } = useAuth();
  const { onboardingIPare } = usePreferencat();
  const modi = useModiAktiv();

  useEffect(() => {
    if (!ngarkohet) SplashScreen.hideAsync().catch(() => {});
  }, [ngarkohet]);

  // Të dhënat e një llogarie nuk duhet t'i shohë llogaria tjetër. Cache-i pastrohet vetëm kur
  // largohet një përdorues që ishte brenda; pas hyrjes do të fshiheshin query-t që sapo kanë nisur.
  const perdoruesiId = sesioni?.user.id;
  const perdoruesiIMeParshem = useRef(perdoruesiId);
  useEffect(() => {
    const iMeParshmi = perdoruesiIMeParshem.current;
    perdoruesiIMeParshem.current = perdoruesiId;
    if (iMeParshmi !== undefined && iMeParshmi !== perdoruesiId) klientiIQuery.clear();
  }, [perdoruesiId]);

  // Splash screen-i mbetet derisa të dihet nëse përdoruesi ka hyrë.
  if (ngarkohet) return null;

  const kaHyre = sesioni !== null;

  // Stack.Protected ridrejton nga ekranet që nuk lejohen. Që nga SDK 58, pa `redirectTo` Expo Router
  // shkon te route-i i parë i lejuar, që për grupin (auth) do të ishte "/(auth)", pa ekran.
  const hyrjaPerTeLejuarit = onboardingIPare ? "/roli" : "/onboarding";
  return (
    <>
      <StatusBar style={eshteErret ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ngjyrat.sfondi },
          headerTintColor: ngjyrat.ari,
          headerTitleStyle: { color: ngjyrat.teksti, fontWeight: "700" },
          headerShadowVisible: false,
          // Në iOS 26+ SDK 58 i bën header-at transparentë dhe përmbajtja hyn poshtë tyre.
          headerTransparent: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: ngjyrat.sfondi },
        }}
      >
        <Stack.Protected guard={!onboardingIPare} redirectTo={kaHyre ? "/" : "/roli"}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && !kaHyre} redirectTo={onboardingIPare ? "/" : "/onboarding"}>
          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && kaHyre} redirectTo={hyrjaPerTeLejuarit}>
          <Stack.Screen name="index" options={{ headerShown: false }} />

          <Stack.Protected guard={modi === "klient"} redirectTo="/sot">
            <Stack.Screen name="(klient)" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="rezervo/[lokaliId]" options={{ title: t("rezervimi.titulli"), presentation: "modal" }} />
            <Stack.Screen name="riplanifiko/[id]" options={{ title: t("terminetEMia.ndryshoTitulli") }} />
          </Stack.Protected>

          <Stack.Protected guard={modi === "biznes"} redirectTo="/zbulo">
            <Stack.Screen name="(biznes)" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="termini/[id]" options={{ title: t("termini.titulli") }} />
            <Stack.Screen name="termini/zhvendos" options={{ title: t("zhvendos.titulli"), presentation: "modal" }} />
            <Stack.Screen name="klienti/[celesi]" options={{ title: "" }} />
            <Stack.Screen name="menaxho/analitika" options={{ title: t("analitika.titulli") }} />
            <Stack.Screen name="menaxho/berberi/[id]" options={{ title: t("berberi.orariIm") }} />
            <Stack.Screen name="shto" options={{ title: t("terminIRi.titulli"), presentation: "modal" }} />
            <Stack.Screen name="lokali-i-ri" options={{ title: t("wizard.titulli"), presentation: "modal" }} />
            <Stack.Screen name="bashkohu" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="menaxho/info" options={{ title: t("info.titulli") }} />
            <Stack.Screen name="menaxho/orari" options={{ title: t("orari.titulli") }} />
            <Stack.Screen name="menaxho/sherbimet" options={{ title: t("sherbimet.titulli") }} />
            <Stack.Screen name="menaxho/sherbimi" options={{ title: "", presentation: "modal" }} />
            <Stack.Screen name="menaxho/stafi" options={{ title: t("stafi.titulli") }} />
          </Stack.Protected>

          <Stack.Screen name="lokali/[id]" options={{ title: "" }} />

          <Stack.Screen name="cilesimet" options={{ title: t("cilesimet.titulli") }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
