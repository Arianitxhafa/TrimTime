import { supabase } from "../lib/supabase";

// Email konfirmimi pas rezervimit ose porosisë (funksioni "dergo-konfirmimin" në server).
// Dërgohet në sfond: nëse klienti s'ka email ose dërgimi dështon, rezervimi mbetet i suksesshëm.
export function dergoKonfirmimin(lloji: "termin" | "porosi", id: string | null | undefined) {
  if (!id) return;
  void supabase.functions.invoke("dergo-konfirmimin", { body: { lloji, id } }).catch(() => {});
}
