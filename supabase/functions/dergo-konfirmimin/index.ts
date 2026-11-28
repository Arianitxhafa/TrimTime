// Studio Burimi · "dergo-konfirmimin": email konfirmimi pas rezervimit ose porosisë.
//
// Aplikacioni e thërret pasi rezervimi/porosia ka dalë me sukses, me sesionin e klientit:
//   { lloji: "termin", id }  → termini (me të gjitha shërbimet e rezervuara bashkë)
//   { lloji: "porosi", id }  → porosia nga dyqani
// Funksioni kontrollon që termini/porosia është e klientit që e thërret, merr email-in e tij
// (email-i i rikuperimit, ose email-i i llogarisë kur është i vërtetë) dhe e dërgon me Gmail.
// Pa email, s'dërgon asgjë. Dështimi i email-it nuk e prish rezervimin.
//
// Sekretet (Supabase → Edge Functions → Secrets): GMAIL_USER, GMAIL_APP_PASSWORD.

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import nodemailer from "npm:nodemailer@6.9.16";

const KOKAT = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const DOMENI_I_TELEFONIT = "@tel.studioburimi.app";
const ZONA = "Europe/Belgrade";

function pergjigju(trupi: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(trupi), { status, headers: KOKAT });
}

function euro(centa: number) {
  return `${(centa / 100).toFixed(2).replace(".", ",").replace(",00", "")} €`;
}

function data(iso: string, gjuha: string) {
  return new Intl.DateTimeFormat(gjuha === "en" ? "en-GB" : "sq-AL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: ZONA,
  }).format(new Date(iso));
}

function ora(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA }).format(
    new Date(iso),
  );
}

Deno.serve(async (kerkesa) => {
  if (kerkesa.method === "OPTIONS") return new Response("ok", { headers: KOKAT });
  if (kerkesa.method !== "POST") return pergjigju({ ok: false }, 405);

  const jwt = kerkesa.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  let lloji = "";
  let id = "";
  try {
    const trupi = await kerkesa.json();
    lloji = String(trupi.lloji ?? "");
    id = String(trupi.id ?? "");
  } catch {
    return pergjigju({ ok: false }, 400);
  }
  if (!["termin", "porosi"].includes(lloji) || !/^[0-9a-f-]{36}$/i.test(id)) return pergjigju({ ok: false }, 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: perdoruesi } = await db.auth.getUser(jwt);
  const user = perdoruesi?.user;
  if (!user) return pergjigju({ ok: false }, 401);

  // Email-i: ai i rikuperimit, ose ai i llogarisë kur s'është email-i i brendshëm i telefonit.
  const { data: rikuperimi } = await db.from("rikuperimi").select("email").eq("perdoruesi_id", user.id).maybeSingle();
  const email = rikuperimi?.email ?? (user.email && !user.email.endsWith(DOMENI_I_TELEFONIT) ? user.email : null);
  if (!email) return pergjigju({ ok: true, derguar: false });

  const { data: profili } = await db.from("profilet").select("emri, gjuha").eq("id", user.id).maybeSingle();
  const gjuha = profili?.gjuha === "en" ? "en" : "sq";
  const emri = (profili?.emri ?? "").split(" ")[0];
  const en = gjuha === "en";

  let subjekti = "";
  let rreshtat: string[] = [];

  if (lloji === "termin") {
    const { data: termini } = await db
      .from("terminet")
      .select("id, lokali_id, berberi_id, klienti_id, krijuar_me")
      .eq("id", id)
      .eq("klienti_id", user.id)
      .maybeSingle();
    if (!termini) return pergjigju({ ok: false }, 404);

    // Shërbimet e rezervuara bashkë ruhen si termine njëri pas tjetrit, me të njëjtën kohë krijimi.
    const { data: terminet } = await db
      .from("terminet")
      .select("fillon_me, mbaron_me, cmimi_centa, sherbimi_id")
      .eq("klienti_id", user.id)
      .eq("berberi_id", termini.berberi_id)
      .eq("krijuar_me", termini.krijuar_me)
      .order("fillon_me");
    const lista = terminet ?? [];
    const { data: sherbimet } = await db
      .from("sherbimet")
      .select("id, emri")
      .in("id", lista.map((x) => x.sherbimi_id).filter(Boolean));
    const { data: berberi } = await db.from("profilet").select("emri").eq("id", termini.berberi_id).maybeSingle();
    const { data: lokali } = await db.from("lokalet").select("emri, adresa, qyteti, telefoni").eq("id", termini.lokali_id).maybeSingle();

    const fillimi = lista[0]?.fillon_me;
    const totali = lista.reduce((s, x) => s + (x.cmimi_centa ?? 0), 0);
    const emratESherbimeve = lista.map((x) => sherbimet?.find((s) => s.id === x.sherbimi_id)?.emri ?? "—");

    subjekti = en
      ? `Booking confirmed: ${data(fillimi, gjuha)} at ${ora(fillimi)}`
      : `Termini u rezervua: ${data(fillimi, gjuha)} në ${ora(fillimi)}`;
    rreshtat = [
      en ? `Hi ${emri},` : `Përshëndetje ${emri},`,
      "",
      en ? `Your booking at ${lokali?.emri ?? "Studio Burimi"} was made successfully.` : `Termini yt te ${lokali?.emri ?? "Studio Burimi"} u rezervua me sukses.`,
      "",
      `${en ? "Date" : "Data"}: ${data(fillimi, gjuha)}`,
      `${en ? "Time" : "Ora"}: ${ora(fillimi)}–${ora(lista[lista.length - 1].mbaron_me)}`,
      `${en ? "Barber" : "Berberi"}: ${berberi?.emri ?? "—"}`,
      `${en ? "Services" : "Shërbimet"}: ${emratESherbimeve.join(", ")}`,
      `${en ? "Total" : "Totali"}: ${euro(totali)} (${en ? "paid at the studio" : "paguhet në Studio"})`,
      "",
      `${lokali?.adresa ?? ""}, ${lokali?.qyteti ?? ""}${lokali?.telefoni ? ` · ${lokali.telefoni}` : ""}`,
      "",
      en
        ? "You can cancel or change it in the app under My bookings."
        : "Mund ta anulosh ose ndryshosh në aplikacion, te Terminet e mia.",
    ];
  } else {
    const { data: porosia } = await db
      .from("porosite")
      .select("id, totali_centa, shenime, porosite_artikujt(emri, cmimi_centa, sasia)")
      .eq("id", id)
      .eq("klienti_id", user.id)
      .maybeSingle();
    if (!porosia) return pergjigju({ ok: false }, 404);
    const numri = `#${porosia.id.slice(0, 6).toUpperCase()}`;
    subjekti = en ? `Order ${numri} received` : `Porosia ${numri} u pranua`;
    rreshtat = [
      en ? `Hi ${emri},` : `Përshëndetje ${emri},`,
      "",
      en ? `Your order ${numri} at Studio Burimi was sent successfully.` : `Porosia jote ${numri} te Studio Burimi u dërgua me sukses.`,
      "",
      ...(porosia.porosite_artikujt ?? []).map(
        (a: { emri: string; cmimi_centa: number; sasia: number }) => `${a.sasia} × ${a.emri} — ${euro(a.cmimi_centa * a.sasia)}`,
      ),
      `${en ? "Total" : "Totali"}: ${euro(porosia.totali_centa)}`,
      "",
      en
        ? "Pick it up and pay at the studio. We'll show it as Ready in the app."
        : "Merre dhe paguaje në Studio. Kur të jetë gati, e sheh te Porositë e mia.",
    ];
  }

  const derguesi = Deno.env.get("GMAIL_USER");
  const fjalekalimi = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!derguesi || !fjalekalimi) {
    console.error("Mungojnë sekretet GMAIL_USER / GMAIL_APP_PASSWORD");
    return pergjigju({ ok: false }, 500);
  }

  try {
    const transporti = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: derguesi, pass: fjalekalimi },
    });
    await transporti.sendMail({
      from: `"Studio Burimi" <${derguesi}>`,
      to: email,
      subject: subjekti,
      text: rreshtat.join("\n"),
    });
  } catch (e) {
    console.error("SMTP", e instanceof Error ? e.message : e);
    return pergjigju({ ok: false }, 500);
  }
  return pergjigju({ ok: true, derguar: true });
});
