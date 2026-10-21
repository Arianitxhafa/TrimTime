import "i18next";
import type { sq } from "./sq";

// Bën që t("auth.hyr") të kontrollohet nga TypeScript: një çelës i gabuar jep gabim.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof sq };
  }
}
