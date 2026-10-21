import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TemaProvider, useTema } from "../context/TemaContext";
import { TerminetProvider } from "../context/TerminetContext";

export default function RootLayout() {
  return (
    <TemaProvider>
      <TerminetProvider>
        <Navigimi />
      </TerminetProvider>
    </TemaProvider>
  );
}

function Navigimi() {
  const { ngjyrat, eshteErret } = useTema();

  return (
    <>
      <StatusBar style={eshteErret ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ngjyrat.sfondi },
          headerTintColor: ngjyrat.ari,
          headerTitleStyle: { color: ngjyrat.teksti, fontWeight: "700" },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: ngjyrat.sfondi },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: "Terminet" }} />
        <Stack.Screen name="termini/[id]" options={{ title: "Detajet e terminit" }} />
        <Stack.Screen name="shto" options={{ title: "Termin i ri", presentation: "modal" }} />
        <Stack.Screen name="cilesimet" options={{ title: "Cilësimet" }} />
      </Stack>
    </>
  );
}
