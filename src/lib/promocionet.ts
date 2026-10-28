import type { TFunction } from "i18next";
import { RENDI_I_DITEVE } from "../components/RedaktoriIOrarit";
import { formatoDaten } from "./datat";
import type { Promocioni, Sherbimi } from "./tipet";

type CelesiIDites = `koha.d${0 | 1 | 2 | 3 | 4 | 5 | 6}`;

// "Hën, Mar · 10:00–14:00 · Qethje · deri më 30 nëntor" — pjesët që mungojnë nuk shfaqen.
export function pershkrimiIPromocionit(p: Promocioni, t: TFunction, sherbimet: Pick<Sherbimi, "id" | "emri">[] = []): string {
  const pjeset: string[] = [];

  if (p.ditet && p.ditet.length < 7) {
    pjeset.push(
      RENDI_I_DITEVE.filter((d) => p.ditet!.includes(d))
        .map((d) => t(`koha.d${d}` as CelesiIDites))
        .join(", "),
    );
  } else {
    pjeset.push(t("promocionet.cdoDite"));
  }

  if (p.ora_nga && p.ora_deri) pjeset.push(`${p.ora_nga}–${p.ora_deri}`);

  const sherbimi = p.sherbimi_id ? sherbimet.find((s) => s.id === p.sherbimi_id) : undefined;
  pjeset.push(sherbimi ? sherbimi.emri : t("promocionet.teGjitha"));

  if (p.vlen_deri) pjeset.push(t("promocionet.deriMe", { data: formatoDaten(p.vlen_deri, t).toLowerCase() }));

  return pjeset.join(" · ");
}

// Promocioni vlen sot sipas datave (ditët dhe orët kontrollohen në server gjatë rezervimit).
export function vlenSot(p: Promocioni, sot: string): boolean {
  return p.aktiv && p.vlen_nga <= sot && (p.vlen_deri === null || p.vlen_deri >= sot);
}
