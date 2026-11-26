import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOpsionetEStackut } from "../../../components/opsionetETabeve";

// Profili ka kokën e vet (baneri me foton e Studios), ndaj header-i i stack-ut fshihet.
export default function Layout() {
  const { t } = useTranslation();
  const opsionet = useOpsionetEStackut();
  return (
    <Stack screenOptions={opsionet}>
      <Stack.Screen name="index" options={{ title: t("tabs.profili"), headerShown: false }} />
    </Stack>
  );
}
