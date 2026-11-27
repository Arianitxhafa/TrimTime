import { Stack } from "expo-router";

// Ballina ka kokën e vet (logoja dhe përshëndetja), pa header-in e stack-ut.
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
