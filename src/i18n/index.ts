import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { changeLanguage } from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { sq } from "./sq";

// Çdo gjuhë duhet të ketë saktësisht të njëjtët çelësa si shqipja.
export type Perkthimet = { [S in keyof typeof sq]: { [K in keyof (typeof sq)[S]]: string } };

export type Gjuha = "sq" | "en";

export const gjuhet: { kodi: Gjuha; emri: string }[] = [
  { kodi: "sq", emri: "Shqip" },
  { kodi: "en", emri: "English" },
];

const CELESI_RUAJTJES = "trimtime.gjuha";

function eshteGjuhe(vlera: string | null | undefined): vlera is Gjuha {
  return vlera === "sq" || vlera === "en";
}

// eslint-disable-next-line import/no-named-as-default-member -- `use` me emër do ngatërrohej me hook-un use() të React-it.
i18n.use(initReactI18next).init({
  resources: { sq: { translation: sq }, en: { translation: en } },
  // Aplikacioni nis gjithmonë në shqip, pavarësisht gjuhës së telefonit; anglishtja zgjidhet te Cilësimet.
  lng: "sq",
  fallbackLng: "sq",
  interpolation: { escapeValue: false },
});

export async function ngarkoGjuhenERuajtur(): Promise<void> {
  try {
    const vlera = await AsyncStorage.getItem(CELESI_RUAJTJES);
    if (eshteGjuhe(vlera)) await changeLanguage(vlera);
  } catch {
    // Mbetet shqipja.
  }
}

export function ndryshoGjuhen(gjuha: Gjuha): void {
  changeLanguage(gjuha);
  AsyncStorage.setItem(CELESI_RUAJTJES, gjuha).catch(() => {});
}

export function gjuhaAktuale(): Gjuha {
  return eshteGjuhe(i18n.language) ? i18n.language : "sq";
}

export default i18n;
