import type { AuthError } from "@supabase/supabase-js";
import type { TFunction } from "i18next";

export const emailIVlefshem = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

// Përkthen kodet e gabimeve të Supabase Auth në mesazhe të qarta për përdoruesin.
export function mesazhiIGabimit(gabimi: AuthError, t: TFunction): string {
  switch (gabimi.code) {
    case "invalid_credentials":
      return t("auth.gabimKredencialet");
    case "email_not_confirmed":
      return t("auth.gabimJoKonfirmuar");
    case "user_already_exists":
    case "email_exists":
      return t("auth.gabimEkziston");
    case "weak_password":
      return t("auth.gabimFjalekalimi");
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return t("auth.gabimShumeKerkesa");
    default:
      return t("pergjithshme.gabimPapritur");
  }
}
