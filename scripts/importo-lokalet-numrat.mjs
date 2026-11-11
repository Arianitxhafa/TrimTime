// Merr nga katalogu Numrat.com të gjithë berberët e Kosovës (emri, telefoni, qyteti, koordinatat)
// dhe shkruan supabase/seed/lokalet_numrat_kosove.sql, që ekzekutohet në Supabase → SQL Editor
// pas seed-it të OpenStreetMap.
//
// Përdorimi:  npm run importo:numrat
//
// Burimi: https://numrat.com/kosove/kategori/berber/ (faqet publike, robots.txt i lejon).
// Aplikacioni e tregon burimin "Numrat.com" te këto lokale. Kërkesat bëhen një nga një, me pauzë.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BAZA = "https://numrat.com";
const KATEGORIA = `${BAZA}/kosove/kategori/berber/`;
const DALJA = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "seed", "lokalet_numrat_kosove.sql");
const PAUZA_MS = 1200;

const prit = (ms) => new Promise((r) => setTimeout(r, ms));

async function merr(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const p = await fetch(url, { headers: { "User-Agent": "TrimTime-importer/1.0" } });
      if (p.ok) return await p.text();
      console.warn(`  ${p.status} për ${url}`);
    } catch (e) {
      console.warn(`  gabim rrjeti për ${url}: ${e.message}`);
    }
    await prit(PAUZA_MS * tentativa * 2);
  }
  throw new Error(`Nuk u mor ${url}`);
}

const ENTITETET = { "&amp;": "&", "&#039;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&#39;": "'" };
const pastro = (t) =>
  t
    .replace(/&(amp|#039|quot|lt|gt|#39);/g, (m) => ENTITETET[m])
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Një faqe qyteti → listimet e saj, plus faqet e tjera (?faqe=N).
function lexoFaqen(html) {
  const listimet = [];
  for (const rreshti of html.split('<li class="lrow">').slice(1)) {
    const lidhja = rreshti.match(/href="\/biznes\/([A-Za-z0-9]+)\/[^"]*\/">([\s\S]*?)<\/a>/);
    const qyteti = rreshti.match(/class="lcell lcity">([\s\S]*?)<\/div>/);
    const telefoni = rreshti.match(/class="num">([\s\S]*?)<\/span>/);
    const pika = rreshti.match(/destination=(-?\d+(?:\.\d+)?)%2C(-?\d+(?:\.\d+)?)/);
    if (!lidhja) continue;
    listimet.push({
      id: lidhja[1],
      emri: pastro(lidhja[2]),
      qyteti: qyteti ? pastro(qyteti[1]) : null,
      telefoni: telefoni ? pastro(telefoni[1]) : null,
      lat: pika ? Number(pika[1]) : null,
      lng: pika ? Number(pika[2]) : null,
    });
  }
  const faqet = [...new Set([...html.matchAll(/\?faqe=(\d+)"/g)].map((m) => Number(m[1])))];
  return { listimet, faqet };
}

const sql = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// Kosova: lokalet me koordinata jashtë saj (gabime në katalog) nuk merren.
const brendaKosoves = (l) => l.lat > 41.8 && l.lat < 43.3 && l.lng > 19.9 && l.lng < 21.8;

console.log("Duke marrë qytetet nga Numrat.com…");
const kategoria = await merr(KATEGORIA);
const qytetet = [...new Set([...kategoria.matchAll(/href="(\/kosove\/[a-z-]+\/berber\/)"/g)].map((m) => m[1]))].filter(
  (u) => !u.includes("/kategori/"),
);
console.log(`Qytete: ${qytetet.length}`);

const teGjitha = new Map();
for (const qyteti of qytetet) {
  await prit(PAUZA_MS);
  const html = await merr(BAZA + qyteti);
  const { listimet, faqet } = lexoFaqen(html);
  for (const faqja of faqet) {
    await prit(PAUZA_MS);
    listimet.push(...lexoFaqen(await merr(`${BAZA}${qyteti}?faqe=${faqja}`)).listimet);
  }
  for (const l of listimet) teGjitha.set(l.id, l);
  console.log(`  ${qyteti}  ${listimet.length}`);
}

const lokalet = [...teGjitha.values()];
const meVendndodhje = lokalet.filter((l) => l.lat !== null && brendaKosoves(l));
console.log(`Lokale: ${lokalet.length} (me koordinata në Kosovë: ${meVendndodhje.length})`);

const rreshtat = meVendndodhje.map(
  (l) =>
    `  (${sql(`numrat/${l.id}`)}, ${sql(l.emri.slice(0, 120))}, ${sql(l.qyteti)}, ${sql(l.telefoni?.slice(0, 30))}, 'SRID=4326;POINT(${l.lng} ${l.lat})')`,
);

const permbajtja = `-- TrimTime · Berberët e Kosovës nga katalogu Numrat.com
-- Gjeneruar më ${new Date().toISOString()} nga scripts/importo-lokalet-numrat.mjs (${meVendndodhje.length} lokale).
-- Burimi: https://numrat.com/kosove/kategori/berber/
--
-- Ekzekutohet pas migrimit 20261114090000_lokalet_numrat.sql dhe pas seed-it të OpenStreetMap.
-- Mund të ekzekutohet sa herë të duash. Një lokal që ekziston tashmë (nga OSM ose TrimTime, brenda
-- 150 m me emër të ngjashëm ose me të njëjtin telefon) nuk shtohet dy herë: lokali nga OSM merr
-- vetëm telefonin, nëse s'e ka.

begin;

create temporary table numrat_e_reja (
  osm_id text,
  emri text,
  qyteti text,
  telefoni text,
  vendndodhja extensions.geography
) on commit drop;

insert into numrat_e_reja (osm_id, emri, qyteti, telefoni, vendndodhja)
select v.osm_id, v.emri, v.qyteti, v.telefoni, v.vendndodhja::extensions.geography
from (values
${rreshtat.join(",\n")}
) as v(osm_id, emri, qyteti, telefoni, vendndodhja);

select public.bashko_lokalet_e_numrat();

commit;
`;

await mkdir(dirname(DALJA), { recursive: true });
await writeFile(DALJA, permbajtja, "utf8");
console.log(`U shkrua ${DALJA}`);
