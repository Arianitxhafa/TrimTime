// Lexuesi falas i kërkesave për termin, pa AI: "Dua fade nesër pas 17:00" → shërbimi, dita dhe
// intervali i orëve. Kupton shqipen (me ose pa ë/ç) dhe anglishten e thjeshtë. Punon në telefon,
// pa internet dhe pa kosto; kur aktivizohet Claude, përdoret ai në vend të këtij.

export type KategoriaELexuar = "qethje" | "fade" | "mjeker" | "femije" | "ngjyrosje" | "asnje";

export type KerkesaELexuar = {
  e_qarte: boolean;
  kategoria: KategoriaELexuar;
  // YYYY-MM-DD dhe HH:MM sipas orës së telefonit
  data: string;
  ora_nga: string;
  ora_deri: string;
};

const ORA_HAPJES = 8;
const ORA_MBYLLJES = 21;

function pa_shenja(t: string): string {
  return t
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function dataISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ora(h: number, m = 0): string {
  return `${String(Math.max(0, Math.min(23, h))).padStart(2, "0")}:${String(Math.max(0, Math.min(59, m))).padStart(2, "0")}`;
}

// Radha ka rëndësi: "qethje fade" është fade, "qethje për fëmijë" është për fëmijë.
const KATEGORITE: [Exclude<KategoriaELexuar, "asnje">, RegExp][] = [
  ["fade", /\b(fade|skin|degrade|taper)/],
  ["femije", /\b(femij|djal|kid|child|i vogel|junior)/],
  ["ngjyrosje", /\b(ngjyr|lyer|lyej|boje|colou?r|dye)/],
  ["mjeker", /\b(mjek|rroj|brisk|beard|shave)/],
  ["qethje", /\b(qeth|prerje|preje|haircut|cut|flok)/],
];

// 0 = e diel, si Date.getDay()
const DITET: [number, RegExp][] = [
  [1, /\b(hene|henen|hena|monday)\b/],
  [2, /\b(marte|marten|martja|tuesday)\b/],
  [3, /\b(merkure|merkuren|merkurja|wednesday)\b/],
  [4, /\b(enjte|enjten|enjtja|thursday)\b/],
  [5, /\b(premte|premten|premtja|friday)\b/],
  [6, /\b(shtune|shtunen|shtuna|saturday)\b/],
  [0, /\b(diel|dielen|diela|sunday)\b/],
];

// Orët 1–7 pa "mëngjes" kuptohen pasdite ("pas 5" = 17:00), sepse berberët s'hapen aq herët.
function oraEArsyeshme(h: number, mengjes: boolean): number {
  return !mengjes && h >= 1 && h <= 7 ? h + 12 : h;
}

export function kuptoKerkesen(teksti: string, tani: Date = new Date()): KerkesaELexuar {
  const t = pa_shenja(teksti);
  let gjetiDicka = false;

  // Shërbimi
  let kategoria: KategoriaELexuar = "asnje";
  for (const [k, re] of KATEGORITE) {
    if (re.test(t)) {
      kategoria = k;
      gjetiDicka = true;
      break;
    }
  }

  // Dita
  const sot = new Date(tani.getFullYear(), tani.getMonth(), tani.getDate());
  let dita = sot;
  const dataEShkruar = t.match(/\b(\d{1,2})[./](\d{1,2})\b/);
  if (/\b(pasneser|pas neser|day after tomorrow)\b/.test(t)) {
    dita = new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + 2);
    gjetiDicka = true;
  } else if (/\b(neser|tomorrow)\b/.test(t)) {
    dita = new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + 1);
    gjetiDicka = true;
  } else if (/\b(sot|today|tonight|sonte)\b/.test(t)) {
    gjetiDicka = true;
  } else if (dataEShkruar) {
    const dd = Number(dataEShkruar[1]);
    const mm = Number(dataEShkruar[2]);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      let d = new Date(sot.getFullYear(), mm - 1, dd);
      if (d < sot) d = new Date(sot.getFullYear() + 1, mm - 1, dd);
      dita = d;
      gjetiDicka = true;
    }
  } else {
    for (const [nr, re] of DITET) {
      if (re.test(t)) {
        const diferenca = (nr - sot.getDay() + 7) % 7;
        dita = new Date(sot.getFullYear(), sot.getMonth(), sot.getDate() + diferenca);
        gjetiDicka = true;
        break;
      }
    }
  }

  // Ora
  const mengjes = /\b(mengjes|paradite|morning|am)\b/.test(t);
  let nga = ORA_HAPJES;
  let ngaMin = 0;
  let deri = ORA_MBYLLJES;
  let deriMin = 0;
  const pas = t.match(/\b(?:pas|after|from|prej)\s+(?:ores?\s+)?(\d{1,2})(?:[:.](\d{2}))?/);
  const para = t.match(/\b(?:para|before|deri|until|by)\s+(?:ores?\s+)?(\d{1,2})(?:[:.](\d{2}))?/);
  const saktesisht = t.match(/\b(?:ne|në|ora|at|rreth|around)\s+(?:ora\s+)?(\d{1,2})(?:[:.](\d{2}))?\b/) ?? t.match(/\b(\d{1,2})[:](\d{2})\b/);
  if (pas || para) {
    if (pas) {
      nga = oraEArsyeshme(Number(pas[1]), mengjes);
      ngaMin = Number(pas[2] ?? 0);
    }
    if (para) {
      deri = oraEArsyeshme(Number(para[1]), mengjes);
      deriMin = Number(para[2] ?? 0);
    }
    gjetiDicka = true;
  } else if (saktesisht) {
    const h = oraEArsyeshme(Number(saktesisht[1]), mengjes);
    const m = Number(saktesisht[2] ?? 0);
    // "në 17:00" → 30 min para deri 1 orë pas, që të dalin edhe orët fqinje.
    const fillimi = h * 60 + m - 30;
    nga = Math.floor(fillimi / 60);
    ngaMin = ((fillimi % 60) + 60) % 60;
    deri = h + 1;
    deriMin = m;
    gjetiDicka = true;
  } else if (mengjes) {
    [nga, deri] = [ORA_HAPJES, 12];
    gjetiDicka = true;
  } else if (/\b(dreke|mesdite|noon|lunch)\b/.test(t)) {
    [nga, deri] = [11, 14];
    gjetiDicka = true;
  } else if (/\b(pasdite|pasditen|afternoon)\b/.test(t)) {
    [nga, deri] = [12, 17];
    gjetiDicka = true;
  } else if (/\b(mbremje|mbremjen|darke|evening|tonight|sonte)\b/.test(t)) {
    [nga, deri] = [17, ORA_MBYLLJES];
    gjetiDicka = true;
  }

  // Sot: asnjëherë para orës aktuale.
  if (dataISO(dita) === dataISO(sot)) {
    const taniMin = tani.getHours() * 60 + tani.getMinutes();
    if (nga * 60 + ngaMin < taniMin) {
      nga = tani.getHours();
      ngaMin = tani.getMinutes();
    }
  }

  // Fjalë për termin pa asgjë tjetër ("dua termin", "a ka vend") vlejnë si kërkesë për sot.
  if (/\b(termin|rezerv|vend|berber|barber|book|appointment|slot)/.test(t)) gjetiDicka = true;

  return {
    e_qarte: gjetiDicka,
    kategoria,
    data: dataISO(dita),
    ora_nga: ora(nga, ngaMin),
    ora_deri: deri * 60 + deriMin <= nga * 60 + ngaMin ? ora(Math.min(nga + 1, 23), ngaMin) : ora(deri, deriMin),
  };
}
