// Çmimet ruhen në cent: 800 → "8 €", 850 → "8,50 €".
export function formatoCmimin(centa: number): string {
  const euro = centa / 100;
  const teksti = Number.isInteger(euro) ? String(euro) : euro.toFixed(2).replace(".", ",");
  return `${teksti} €`;
}

// "8,50" ose "8.5" → 850; null kur teksti nuk është çmim i vlefshëm.
export function lexoCmimin(teksti: string): number | null {
  const pastruar = teksti.trim().replace("€", "").replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(pastruar)) return null;
  return Math.round(Number(pastruar) * 100);
}

export function formatoDistancen(metra: number): string {
  if (metra < 1000) return `${Math.max(10, Math.round(metra / 10) * 10)} m`;
  const km = metra / 1000;
  return `${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km`;
}

export function formatoKohezgjatjen(minuta: number): string {
  if (minuta < 60) return `${minuta} min`;
  const ore = Math.floor(minuta / 60);
  const mbetja = minuta % 60;
  return mbetja === 0 ? `${ore} h` : `${ore} h ${mbetja} min`;
}

// "09:00:00" → "09:00"
export function shkurtoOren(ora: string): string {
  return ora.slice(0, 5);
}
