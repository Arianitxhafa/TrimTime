import { Stack } from "expo-router";

// Tab-i Rezervo ka kokën e vet ("Zgjidh berberin tënd"), pa header-in e stack-ut.
export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
