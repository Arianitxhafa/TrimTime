// Hyrja me telefon + fjalëkalim, pa SMS: numri kthehet në një "email" të brendshëm që Supabase Auth
// e përdor si emër përdoruesi. Ky email nuk merr kurrë mesazhe ("Confirm email" duhet të jetë i fikur).
export const DOMENI_I_TELEFONIT = "tel.studioburimi.app";

export type Prefiksi = { kodi: string; shteti: string; prefiksi: string };

// Kosova e para; pastaj vendet ku jetojnë më shumë klientë të Studios (familje, diasporë).
export const PREFIKSET: Prefiksi[] = [
  { kodi: "XK", shteti: "Kosova", prefiksi: "383" },
  { kodi: "AL", shteti: "Shqipëria", prefiksi: "355" },
  { kodi: "MK", shteti: "Maqedonia e Veriut", prefiksi: "389" },
  { kodi: "ME", shteti: "Mali i Zi", prefiksi: "382" },
  { kodi: "RS", shteti: "Serbia", prefiksi: "381" },
  { kodi: "DE", shteti: "Gjermania", prefiksi: "49" },
  { kodi: "CH", shteti: "Zvicra", prefiksi: "41" },
  { kodi: "AT", shteti: "Austria", prefiksi: "43" },
  { kodi: "SE", shteti: "Suedia", prefiksi: "46" },
  { kodi: "IT", shteti: "Italia", prefiksi: "39" },
  { kodi: "GB", shteti: "Mbretëria e Bashkuar", prefiksi: "44" },
  { kodi: "US", shteti: "SHBA", prefiksi: "1" },
];

// "048 169 820" + 383 → "+38348169820"; null kur numri është shumë i shkurtër ose shumë i gjatë.
export function numriNderkombetar(prefiksi: string, numri: string): string | null {
  let shifrat = numri.replace(/\D/g, "");
  if (shifrat.startsWith("00")) shifrat = shifrat.slice(2);
  if (shifrat.startsWith(prefiksi) && shifrat.length > prefiksi.length + 6) shifrat = shifrat.slice(prefiksi.length);
  shifrat = shifrat.replace(/^0+/, "");
  if (shifrat.length < 6 || shifrat.length > 12) return null;
  return `+${prefiksi}${shifrat}`;
}

export function emailNgaTelefoni(nderkombetar: string): string {
  return `${nderkombetar.replace(/\D/g, "")}@${DOMENI_I_TELEFONIT}`;
}

// A është ky email ai i brendshmi i telefonit (që s'duhet shfaqur si email)?
export function eshteEmailITelefonit(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${DOMENI_I_TELEFONIT}`));
}

// "38348169820@tel…" → "+383 48 169 820" për t'u shfaqur.
export function telefoniNgaEmaili(email: string): string {
  const shifrat = email.split("@")[0];
  const p = PREFIKSET.find((x) => shifrat.startsWith(x.prefiksi));
  if (!p) return `+${shifrat}`;
  const pjesa = shifrat.slice(p.prefiksi.length);
  return `+${p.prefiksi} ${pjesa.replace(/(\d{2})(\d{3})(\d+)/, "$1 $2 $3")}`;
}
