// Studio Burimi · "dergo-kodin": dërgon me email kodin për fjalëkalim të ri.
//
// Klienti (pa hyrë) dërgon numrin e telefonit. Nëse llogaria ka email rikuperimi, baza krijon një
// kod 6-shifror (pergatit_kodin_e_rikuperimit) dhe ky funksion ia dërgon me Gmail (SMTP, porta 465).
// Përgjigjja është gjithmonë e njëjtë, që askush të mos mësojë cilat numra kanë llogari.
//
// Sekretet (Supabase → Edge Functions → Secrets), kurrë në kod:
//   GMAIL_USER          adresa Gmail që dërgon, p.sh. studioburimi.app@gmail.com
//   GMAIL_APP_PASSWORD  "App password" 16-shkronjësh nga Google (jo fjalëkalimi i llogarisë)
// SUPABASE_URL dhe SUPABASE_SERVICE_ROLE_KEY i jep vetë Supabase.

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import nodemailer from "npm:nodemailer@6.9.16";

const KOKAT = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function pergjigju(status = 200) {
  return new Response(JSON.stringify({ ok: status === 200 }), { status, headers: KOKAT });
}

Deno.serve(async (kerkesa) => {
  if (kerkesa.method === "OPTIONS") return new Response("ok", { headers: KOKAT });
  if (kerkesa.method !== "POST") return pergjigju(405);

  let telefoni = "";
  let gjuha = "sq";
  try {
    const trupi = await kerkesa.json();
    telefoni = String(trupi.telefoni ?? "").slice(0, 32);
    gjuha = trupi.gjuha === "en" ? "en" : "sq";
  } catch {
    return pergjigju(400);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("pergatit_kodin_e_rikuperimit", { p_telefoni: telefoni });
  if (error) {
    console.error("pergatit_kodin_e_rikuperimit", error.message);
    return pergjigju(500);
  }
  const rreshti = (data as { email: string; kodi: string }[] | null)?.[0];
  if (!rreshti) return pergjigju();

  const derguesi = Deno.env.get("GMAIL_USER");
  const fjalekalimi = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!derguesi || !fjalekalimi) {
    console.error("Mungojnë sekretet GMAIL_USER / GMAIL_APP_PASSWORD");
    return pergjigju(500);
  }

  const kodi = `${rreshti.kodi.slice(0, 3)} ${rreshti.kodi.slice(3)}`;
  const teksti =
    gjuha === "en"
      ? {
          subjekti: `Studio Burimi code: ${kodi}`,
          trupi: `Your code for a new Studio Burimi password is ${kodi}.\n\nIt's valid for 15 minutes. If you didn't ask for it, ignore this email.`,
        }
      : {
          subjekti: `Kodi i Studio Burimit: ${kodi}`,
          trupi: `Kodi yt për fjalëkalim të ri në Studio Burimi është ${kodi}.\n\nVlen 15 minuta. Nëse nuk e ke kërkuar ti, injoroje këtë email.`,
        };

  try {
    const transporti = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: derguesi, pass: fjalekalimi },
    });
    await transporti.sendMail({
      from: `"Studio Burimi" <${derguesi}>`,
      to: rreshti.email,
      subject: teksti.subjekti,
      text: teksti.trupi,
    });
  } catch (e) {
    console.error("SMTP", e instanceof Error ? e.message : e);
    return pergjigju(500);
  }
  return pergjigju();
});
