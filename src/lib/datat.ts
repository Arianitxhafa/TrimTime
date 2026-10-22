import type { TFunction } from "i18next";

// Data lokale e pajisjes si "YYYY-MM-DD" (jo UTC, që pas mesnatës të mos dalë dita e djeshme).
export function dataISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ngaISO(iso: string): Date {
  const [v, m, d] = iso.split("-").map(Number);
  return new Date(v, m - 1, d);
}

export function ditetEArdhshme(sa: number, nga = new Date()): string[] {
  return Array.from({ length: sa }, (_, i) => dataISO(new Date(nga.getFullYear(), nga.getMonth(), nga.getDate() + i)));
}

export function shtoDite(iso: string, dite: number): string {
  const d = ngaISO(iso);
  return dataISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + dite));
}

type CelesiIDites = `koha.d${0 | 1 | 2 | 3 | 4 | 5 | 6}`;
type CelesiIMuajit = `koha.m${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;

export function emriShkurterIDites(iso: string, t: TFunction): string {
  return t(`koha.d${ngaISO(iso).getDay()}` as CelesiIDites);
}

// "Sot", "Nesër" ose "Mër, 24 tetor".
export function formatoDaten(iso: string, t: TFunction): string {
  const sot = dataISO(new Date());
  if (iso === sot) return t("koha.sot");
  if (iso === shtoDite(sot, 1)) return t("koha.neser");
  const d = ngaISO(iso);
  return `${emriShkurterIDites(iso, t)}, ${d.getDate()} ${t(`koha.m${d.getMonth()}` as CelesiIMuajit)}`;
}
