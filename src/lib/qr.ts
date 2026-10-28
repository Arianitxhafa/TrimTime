// Përmbajtja e kodeve QR të TrimTime. Skema është e njëjtë me "scheme" në app.json, që kodi të
// hapë aplikacionin edhe kur skanohet me kamerën e telefonit.

const SKEMA = "trimtime://";

export function qrILokalit(lokaliId: string): string {
  return `${SKEMA}lokali/${lokaliId}`;
}

export function qrIFteses(kodi: string): string {
  return `${SKEMA}bashkohu?kodi=${kodi}`;
}

export type QrILexuar = { lloji: "lokali"; lokaliId: string } | { lloji: "ftesa"; kodi: string } | null;

// Pranon edhe lidhjet e Expo Go (exp://…/--/lokali/<id>), jo vetëm trimtime://.
export function lexoQr(teksti: string): QrILexuar {
  const lokali = teksti.match(/lokali\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (lokali) return { lloji: "lokali", lokaliId: lokali[1].toLowerCase() };
  const ftesa = teksti.match(/bashkohu\?kodi=([A-Z2-9]{8})\b/i);
  if (ftesa) return { lloji: "ftesa", kodi: ftesa[1].toUpperCase() };
  return null;
}
