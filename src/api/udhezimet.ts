import { Linking, Platform } from "react-native";
import { lidhjaEUdhezimeve } from "../lib/vendndodhja";

// "Udhëzimet" hapin aplikacionin e hartave të telefonit (Apple Maps ose Google Maps) deri te lokali.
export function useHapUdhezimet() {
  return (lokali: { id?: string; lat: number; lng: number }) => {
    void Linking.openURL(lidhjaEUdhezimeve(lokali, Platform.OS));
  };
}
