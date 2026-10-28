import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

// Telefoni ka Face ID ose gjurmë gishti të regjistruar.
export async function kaBiometri(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const [kaHardware, eshteRegjistruar] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return kaHardware && eshteRegjistruar;
}

// Hap dritaren e sistemit për Face ID / gjurmë; kodi i telefonit pranohet si rezervë.
export async function verifiko(mesazhi: string): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const rezultati = await LocalAuthentication.authenticateAsync({ promptMessage: mesazhi });
  return rezultati.success;
}
