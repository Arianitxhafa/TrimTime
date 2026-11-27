import { Stack } from "expo-router";

// Dyqani ka kokën e vet (kërkimi dhe "Porositë"), pa header-in e stack-ut.
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
