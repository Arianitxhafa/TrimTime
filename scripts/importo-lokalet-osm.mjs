// Merr nga OpenStreetMap të gjitha lokalet e qethjes në Kosovë dhe shkruan
// supabase/seed/lokalet_osm_kosove.sql, që ekzekutohet në Supabase → SQL Editor.
//
// Përdorimi:  npm run importo:osm
//
// Të dhënat: © OpenStreetMap contributors, licenca ODbL (https://www.openstreetmap.org/copyright).
// Aplikacioni duhet ta shfaqë këtë atribuim kudo ku i tregon këto lokale.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Serverët publikë të Overpass ngarkohen shpesh (502/504); provohen me radhë, disa herë.
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const DALJA = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed", "lokalet_osm_kosove.sql");

const PYETJA_LOKALET = `[out:json][timeout:120];
area["ISO3166-1"="XK"][admin_level=2]->.k;
(
  nwr["shop"="hairdresser"](area.k);
  nwr["shop"="barber"](area.k);
);
out center tags;`;

const PYETJA_QYTETET = `[out:json][timeout:60];
area["ISO3166-1"="XK"][admin_level=2]->.k;
node["place"~"^(city|town)$"](area.k);
out;`;

async function pyet(pyetja) {
  let gabimi;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    for (const serveri of OVERPASS) {
      try {
        const pergjigjja = await fetch(serveri, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "TrimTime-import/1.0 (projekt studentor)",
          },
          body: "data=" + encodeURIComponent(pyetja),
        });
        if (pergjigjja.ok) return (await pergjigjja.json()).elements;
        gabimi = new Error(`${serveri} ktheu ${pergjigjja.status}`);
      } catch (e) {
        gabimi = e;
      }
      console.log(`  ${gabimi.message}; po provoj tjetrin…`);
    }
    await new Promise((r) => setTimeout(r, 5000 * (tentativa + 1)));
  }
  throw gabimi;
}

// ── Orari: "Mo-Sa 09:00-20:00; Su off" → [{ dita, hapet, mbyllet }] ─────────
const DITET = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };
const RENDI = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function zgjeroDitet(pjesa) {
  const ditet = new Set();
  for (const grupi of pjesa.split(",")) {
    const [nga, deri] = grupi.split("-");
    if (!(nga in DITET) || (deri && !(deri in DITET))) return null;
    if (!deri) {
      ditet.add(DITET[nga]);
      continue;
    }
    // Lejon edhe intervale që kalojnë të dielën, p.sh. Sa-Mo.
    for (let i = RENDI.indexOf(nga); ; i = (i + 1) % 7) {
      ditet.add(DITET[RENDI[i]]);
      if (RENDI[i] === deri) break;
    }
  }
  return ditet;
}

function ora(h, m) {
  return h === 24 && m === 0 ? "23:59" : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Kthen null kur formati nuk kuptohet; atëherë lokali shfaqet pa orar.
export function lexoOrarin(teksti) {
  const sipasDites = new Map();
  for (const rregulli of teksti.split(";").map((r) => r.trim()).filter(Boolean)) {
    if (rregulli === "24/7") {
      for (const d of Object.values(DITET)) sipasDites.set(d, [{ hapet: "00:00", mbyllet: "23:59" }]);
      continue;
    }
    const m = rregulli.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(.*)$/);
    if (!m) return null;
    const ditet = m[1] ? zgjeroDitet(m[1]) : new Set(Object.values(DITET));
    if (!ditet) return null;

    const oret = m[2].trim();
    if (/^(off|closed)$/i.test(oret)) {
      for (const d of ditet) sipasDites.delete(d);
      continue;
    }

    const intervalet = [];
    for (const pjesa of oret.split(",").map((p) => p.trim())) {
      const o = pjesa.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!o) return null;
      const hapet = ora(+o[1], +o[2]);
      const mbyllet = ora(+o[3], +o[4]);
      // Intervalet e pavlefshme ose që kalojnë mesnatën anashkalohen.
      if (mbyllet > hapet) intervalet.push({ hapet, mbyllet });
    }
    if (intervalet.length === 0) continue;
    for (const d of ditet) sipasDites.set(d, intervalet);
  }

  const rezultati = [];
  for (const [dita, intervalet] of sipasDites) {
    const renditur = [...intervalet].sort((a, b) => a.hapet.localeCompare(b.hapet));
    if (renditur.some((o, i) => i > 0 && renditur[i - 1].mbyllet > o.hapet)) continue;
    for (const o of renditur) rezultati.push({ dita, ...o });
  }
  return rezultati;
}

// ── Ndihmës ──────────────────────────────────────────────────────────────────
function distanca(a, b) {
  const R = 6371e3;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const sql = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// Shumica e lokaleve në OSM nuk kanë etiketë gjinie, ndaj përdoren edhe emrat. Fshihen vetëm ato
// qartësisht për femra; berberët dhe lokalet e paqarta mbeten (TrimTime është për berberë).
const FEMRA = /frizere\b|frizerja|p[eë]r femra|beauty|make ?up|estetik|esteticien|massage|masazh|kozmet|nails|thonj|bukuri/i;
const MESHKUJ = /barber|berber|p[eë]r meshkuj|\bman\b|\bmen\b|gent/i;

function klientela(t, emri) {
  if (t.unisex === "yes" || (t.male === "yes" && t.female === "yes")) return "unisex";
  if (t.male === "yes" || t.hairdresser === "barber" || t.shop === "barber" || MESHKUJ.test(emri)) return "meshkuj";
  if (t.female === "yes" || FEMRA.test(emri)) return "femra";
  return "meshkuj";
}
const shkurto = (v, n) => (v ? String(v).trim().slice(0, n) : null);

// ── Importi ──────────────────────────────────────────────────────────────────
console.log("Duke marrë qytetet e Kosovës…");
const qytetet = (await pyet(PYETJA_QYTETET))
  .map((q) => ({ emri: q.tags["name:sq"] || q.tags.name, lat: q.lat, lng: q.lon, lloji: q.tags.place }))
  .filter((q) => q.emri);

console.log("Duke marrë lokalet e qethjes…");
const elementet = await pyet(PYETJA_LOKALET);

const lokalet = [];
for (const e of elementet) {
  const t = e.tags ?? {};
  // P.sh. xhami ose objekte të tjera që në OSM kanë gabimisht edhe shop=hairdresser.
  if (t.amenity || t.tourism || t.building === "mosque") continue;

  const pika = e.type === "node" ? { lat: e.lat, lng: e.lon } : e.center ? { lat: e.center.lat, lng: e.center.lon } : null;
  if (!pika) continue;

  const qytetiMeIAfert = qytetet.reduce(
    (me, q) => {
      const d = distanca(pika, q);
      return d < me.d ? { q, d } : me;
    },
    { q: null, d: Infinity },
  ).q;
  const qyteti = shkurto(t["addr:city"], 80) || qytetiMeIAfert?.emri || "Kosovë";

  const rruga = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
  const adresa = shkurto(rruga || t["addr:place"], 200);

  const emri = shkurto(t["name:sq"] || t.name || t.brand, 80);

  lokalet.push({
    osm_id: `${e.type}/${e.id}`,
    emri: emri && emri.length >= 2 ? emri : `Lokal qethjeje · ${qyteti}`.slice(0, 80),
    adresa: adresa && adresa.length >= 3 ? adresa : "Shiko në hartë",
    qyteti: qyteti.length >= 2 ? qyteti : "Kosovë",
    telefoni: shkurto(t.phone || t["contact:phone"], 30),
    klientela: klientela(t, t.name || ""),
    pika,
    orari: t.opening_hours ? lexoOrarin(t.opening_hours) : null,
  });
}

const meOrar = lokalet.filter((l) => l.orari && l.orari.length > 0);
const perFemra = lokalet.filter((l) => l.klientela === "femra").length;
console.log(`Lokale: ${lokalet.length} (me orar të lexuar: ${meOrar.length}, vetëm për femra: ${perFemra})`);

const rreshtatQytetet = qytetet.map(
  (q) => `  (${sql(q.emri)}, '${q.lloji === "city" ? "city" : "town"}', 'SRID=4326;POINT(${q.lng} ${q.lat})')`,
);

const rreshtatLokalet = lokalet.map(
  (l) =>
    `  (${sql(l.osm_id)}, ${sql(l.emri)}, ${sql(l.adresa)}, ${sql(l.qyteti)}, ${sql(l.telefoni)}, ` +
    `${sql(l.klientela)}, 'SRID=4326;POINT(${l.pika.lng} ${l.pika.lat})')`,
);

const rreshtatOraret = meOrar.flatMap((l) =>
  l.orari.map((o) => `  (${sql(l.osm_id)}, ${o.dita}, '${o.hapet}', '${o.mbyllet}')`),
);

const permbajtja = `-- TrimTime · Lokalet e qethjes në Kosovë nga OpenStreetMap
-- Gjeneruar më ${new Date().toISOString()} nga scripts/importo-lokalet-osm.mjs (${lokalet.length} lokale).
-- Të dhënat: © OpenStreetMap contributors, ODbL — https://www.openstreetmap.org/copyright
--
-- Ekzekutohet pas migrimit 20261028150000_zona_dhe_kamera.sql. Mund të ekzekutohet sa herë të duash:
-- lokalet ekzistuese përditësohen, nuk dyfishohen, dhe lokalet që i ka marrë një pronar nuk preken.

begin;

-- Qendrat e qyteteve: klienti sheh lokalet e qytetit ku ndodhet.
insert into public.qytetet (emri, lloji, vendndodhja)
select v.emri, v.lloji, v.vendndodhja::extensions.geography
from (values
${rreshtatQytetet.join(",\n")}
) as v(emri, lloji, vendndodhja)
on conflict (emri) do update set
  lloji = excluded.lloji,
  vendndodhja = excluded.vendndodhja;

insert into public.lokalet (osm_id, emri, adresa, qyteti, telefoni, klientela, vendndodhja, burimi, i_publikuar)
select v.osm_id, v.emri, v.adresa, v.qyteti, v.telefoni, v.klientela, v.vendndodhja::extensions.geography, 'osm', true
from (values
${rreshtatLokalet.join(",\n")}
) as v(osm_id, emri, adresa, qyteti, telefoni, klientela, vendndodhja)
on conflict (osm_id) do update set
  emri = excluded.emri,
  adresa = excluded.adresa,
  qyteti = excluded.qyteti,
  telefoni = excluded.telefoni,
  klientela = excluded.klientela,
  vendndodhja = excluded.vendndodhja
where public.lokalet.burimi = 'osm';

-- Çdo lokal (edhe ato të krijuara në TrimTime) lidhet me qytetin më të afërt.
update public.lokalet set qyteti_id = public.qyteti_me_i_afert(vendndodhja);

delete from public.oraret_e_lokalit o
using public.lokalet l
where o.lokali_id = l.id and l.burimi = 'osm';

${
  rreshtatOraret.length > 0
    ? `insert into public.oraret_e_lokalit (lokali_id, dita, hapet, mbyllet)
select l.id, v.dita, v.hapet::time, v.mbyllet::time
from (values
${rreshtatOraret.join(",\n")}
) as v(osm_id, dita, hapet, mbyllet)
join public.lokalet l on l.osm_id = v.osm_id and l.burimi = 'osm';`
    : "-- Asnjë orar i lexueshëm."
}

commit;
`;

await mkdir(dirname(DALJA), { recursive: true });
await writeFile(DALJA, permbajtja, "utf8");
console.log(`U shkrua ${DALJA}`);
