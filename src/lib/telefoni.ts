import { Platform } from "react-native";

// Numri në formatin ndërkombëtar ("+38344123456"). Numrat e Kosovës pa prefiks e marrin +383.
export function numriNderkombetar(telefoni: string): string | null {
  let numri = telefoni.replace(/[^\d+]/g, "");
  if (numri.startsWith("00")) numri = `+${numri.slice(2)}`;
  if (numri.startsWith("+")) return numri.length >= 9 ? numri : null;
  if (numri.startsWith("383")) return `+${numri}`;
  if (numri.startsWith("0")) numri = numri.slice(1);
  return numri.length >= 8 ? `+383${numri}` : null;
}

// Celularët e Kosovës (+383 43–49): vetëm këta marrin SMS dhe WhatsApp; numrat fiks vetëm thirrje.
export function eshteCelular(numri: string): boolean {
  return /^\+3834[3-9]\d{6}$/.test(numri);
}

export function lidhjaWhatsApp(numri: string, mesazhi: string): string {
  return `https://wa.me/${numri.replace("+", "")}?text=${encodeURIComponent(mesazhi)}`;
}

// iOS e ndan trupin e mesazhit me "&", Android me "?".
export function lidhjaSms(numri: string, mesazhi: string): string {
  return `sms:${numri}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(mesazhi)}`;
}

export function lidhjaEThirrjes(telefoni: string): string {
  return `tel:${telefoni.replace(/\s/g, "")}`;
}
