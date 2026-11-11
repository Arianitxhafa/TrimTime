// TrimTime · Asistenti AI (Supabase Edge Function, Deno)
//
// Dy veprime, të dyja me Claude:
//   * "stili":    selfie → forma e fytyrës dhe 3 qethje që i shkojnë, me kategorinë për filtrin e Zbulo;
//   * "rezervo":  "dua fade nesër pas 17:00" → shërbimi, dita dhe intervali i orëve.
// Çelësi ANTHROPIC_API_KEY ruhet si secret i Supabase, kurrë në aplikacion. Funksioni thirret vetëm
// nga përdorues të kyçur (JWT) dhe çdo përdorues ka një kufi ditor (rrit_perdorimin_e_asistentit).

import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const MODELI = "claude-opus-5-5";
const KUFIRI_DITOR = 20;
const FOTO_MAX_BAJT = 5 * 1024 * 1024;
const KATEGORITE = ["qethje", "fade", "mjeker", "femije", "ngjyrosje", "asnje"] as const;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pergjigje(trupi: unknown, statusi = 200): Response {
  return new Response(JSON.stringify(trupi), {
    status: statusi,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const SKEMA_STILI = {
  type: "object",
  properties: {
    eshte_fytyre: { type: "boolean" },
    forma_e_fytyres: { type: "string" },
    pershkrimi: { type: "string" },
    stilet: {
      type: "array",
      items: {
        type: "object",
        properties: {
          emri: { type: "string" },
          pse: { type: "string" },
          kategoria: { type: "string", enum: [...KATEGORITE] },
          si_ta_kerkosh: { type: "string" },
        },
        required: ["emri", "pse", "kategoria", "si_ta_kerkosh"],
        additionalProperties: false,
      },
    },
  },
  required: ["eshte_fytyre", "forma_e_fytyres", "pershkrimi", "stilet"],
  additionalProperties: false,
};

const SKEMA_REZERVO = {
  type: "object",
  properties: {
    e_qarte: { type: "boolean" },
    kategoria: { type: "string", enum: [...KATEGORITE] },
    data: { type: "string" },
    ora_nga: { type: "string" },
    ora_deri: { type: "string" },
    kuptova: { type: "string" },
  },
  required: ["e_qarte", "kategoria", "data", "ora_nga", "ora_deri", "kuptova"],
  additionalProperties: false,
};

function gjuha(kodi: unknown): string {
  return kodi === "en" ? "English" : "Albanian (shqip, as spoken in Kosovo)";
}

const SISTEMI_STILI = (g: string) => `You are the style advisor inside TrimTime, a booking app for men's barbershops in Kosovo.
The user sends a photo of their face. Look at face shape, hairline, hair type and current length, and recommend exactly 3 men's haircuts that would suit them and that a typical barber in Kosovo can do.
For each haircut give: its common name (keep well-known English names like "Skin Fade" or "Textured Crop"), one sentence on why it suits this face, the closest category for the app's filter (qethje = classic cut, fade, mjeker = beard work, femije = kids, ngjyrosje = colouring, asnje = none fits), and one short sentence the user can say to the barber.
Be kind and specific; never comment on attractiveness, weight, age or ethnicity. If the photo does not clearly show a face, set eshte_fytyre to false and return an empty list.
Write every text field in ${g}.`;

const SISTEMI_REZERVO = (g: string) => `You turn a short booking request for a men's barbershop into search parameters for the TrimTime app.
Categories: qethje (haircut), fade, mjeker (beard), femije (kids' cut), ngjyrosje (colouring), asnje (not specified - any service).
Resolve relative dates ("sot", "nesër", "të shtunën", "today", "tomorrow", "Saturday") against the current date and time you are given, in Kosovo time. Use dates in YYYY-MM-DD and times in HH:MM (24h).
Time window: "pas 17:00" means 17:00-21:00, "para 12" means 08:00-12:00, "në mëngjes" 08:00-12:00, "pasdite" 12:00-17:00, "në mbrëmje" 17:00-21:00, no time means 08:00-21:00. If the day is today, never start before the current time.
If the request is not about booking a barber at all, set e_qarte to false.
kuptova is one short phrase in ${g} that restates what you understood (for example "Fade, nesër pas 17:00").`;

// Thirrja e Claude me përgjigje JSON sipas skemës. Nëse modeli refuzon, fallback-u i serverit
// e provon me një model tjetër; nëse refuzon i gjithë zinxhiri, kthehet null.
async function pyetClaude(
  anthropic: Anthropic,
  sistemi: string,
  permbajtja: Anthropic.Beta.BetaContentBlockParam[],
  skema: Record<string, unknown>,
  effort: "low" | "medium",
): Promise<unknown | null> {
  const pergjigja = await anthropic.beta.messages.create({
    model: MODELI,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: sistemi,
    output_config: { effort, format: { type: "json_schema", schema: skema } },
    messages: [{ role: "user", content: permbajtja }],
  });
  if (pergjigja.stop_reason === "refusal") return null;
  const teksti = pergjigja.content.find((b) => b.type === "text");
  if (!teksti || teksti.type !== "text") return null;
  return JSON.parse(teksti.text);
}

function tani(): { data: string; ora: string; dita: string } {
  const z = "Europe/Belgrade";
  const d = new Date();
  const data = new Intl.DateTimeFormat("en-CA", { timeZone: z }).format(d);
  const ora = new Intl.DateTimeFormat("en-GB", { timeZone: z, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  const dita = new Intl.DateTimeFormat("en-GB", { timeZone: z, weekday: "long" }).format(d);
  return { data, ora, dita };
}

const ORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return pergjigje({ gabim: "metoda" }, 405);

  const autorizimi = req.headers.get("Authorization");
  if (!autorizimi) return pergjigje({ gabim: "pa_llogari" }, 401);

  const celesi = Deno.env.get("ANTHROPIC_API_KEY");
  if (!celesi) return pergjigje({ gabim: "pa_konfigurim" }, 503);

  // Klienti i Supabase me JWT-në e përdoruesit: kufiri ditor numërohet për atë përdorues.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: autorizimi } },
  });
  const { data: brendaKufirit, error: gabimiKufirit } = await supabase.rpc("rrit_perdorimin_e_asistentit", {
    p_kufiri: KUFIRI_DITOR,
  });
  if (gabimiKufirit) return pergjigje({ gabim: "pa_llogari" }, 401);
  if (!brendaKufirit) return pergjigje({ gabim: "kufiri" }, 429);

  let trupi: Record<string, unknown>;
  try {
    trupi = await req.json();
  } catch {
    return pergjigje({ gabim: "kerkese" }, 400);
  }

  const anthropic = new Anthropic({ apiKey: celesi });
  const g = gjuha(trupi.gjuha);

  try {
    if (trupi.veprimi === "stili") {
      const foto = typeof trupi.foto === "string" ? trupi.foto : "";
      const lloji = trupi.lloji === "image/png" ? "image/png" : "image/jpeg";
      if (!foto || foto.length * 0.75 > FOTO_MAX_BAJT) return pergjigje({ gabim: "foto" }, 400);
      const rezultati = await pyetClaude(
        anthropic,
        SISTEMI_STILI(g),
        [
          { type: "image", source: { type: "base64", media_type: lloji, data: foto } },
          { type: "text", text: "Which haircuts would suit me?" },
        ],
        SKEMA_STILI,
        "medium",
      );
      if (!rezultati) return pergjigje({ gabim: "refuzim" }, 422);
      return pergjigje(rezultati);
    }

    if (trupi.veprimi === "rezervo") {
      const teksti = typeof trupi.teksti === "string" ? trupi.teksti.trim().slice(0, 300) : "";
      if (!teksti) return pergjigje({ gabim: "kerkese" }, 400);
      const t = tani();
      const rezultati = (await pyetClaude(
        anthropic,
        SISTEMI_REZERVO(g),
        [{ type: "text", text: `Now in Kosovo: ${t.dita} ${t.data} ${t.ora}.\nRequest: ${teksti}` }],
        SKEMA_REZERVO,
        "low",
      )) as Record<string, unknown> | null;
      if (!rezultati) return pergjigje({ gabim: "refuzim" }, 422);
      // Vlerat që shkojnë te SQL kontrollohen këtu, pavarësisht skemës.
      const data = typeof rezultati.data === "string" && DATA.test(rezultati.data) ? rezultati.data : t.data;
      const oraNga = typeof rezultati.ora_nga === "string" && ORA.test(rezultati.ora_nga) ? rezultati.ora_nga : "08:00";
      const oraDeri = typeof rezultati.ora_deri === "string" && ORA.test(rezultati.ora_deri) ? rezultati.ora_deri : "21:00";
      const kategoria = KATEGORITE.includes(rezultati.kategoria as (typeof KATEGORITE)[number])
        ? rezultati.kategoria
        : "asnje";
      return pergjigje({ ...rezultati, data, ora_nga: oraNga, ora_deri: oraDeri, kategoria });
    }

    return pergjigje({ gabim: "veprimi" }, 400);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return pergjigje({ gabim: "i_zene" }, 503);
    if (e instanceof Anthropic.AuthenticationError) return pergjigje({ gabim: "pa_konfigurim" }, 503);
    if (e instanceof Anthropic.APIError) return pergjigje({ gabim: "claude" }, 502);
    if (e instanceof SyntaxError) return pergjigje({ gabim: "claude" }, 502);
    throw e;
  }
});
