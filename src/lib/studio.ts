// Aplikacioni shërben vetëm një lokal: Studio Burimin. Ky është rreshti i tij te tabela `lokalet`
// (burimi = 'trimtime'). Nuk është sekret: çdo klient e lexon lokalin e publikuar.
export const STUDIO_ID = "7828d796-304f-4253-aa38-a748cbcd5365";

export const EMRI_I_STUDIOS = "Studio Burimi";

export const INSTAGRAMI = "https://www.instagram.com/studioburimi/";

// Punime të Studios (nga Instagram-i i saj), brenda aplikacionit: kopertina dhe onboarding-u i
// kanë gati pa internet. Fotot që stafi ngarkon te Portofoli shfaqen te "Punimet".
export const FOTOT_E_STUDIOS = [
  require("../../assets/studio/punim-1.jpg"),
  require("../../assets/studio/punim-2.jpg"),
  require("../../assets/studio/punim-3.jpg"),
  require("../../assets/studio/punim-4.jpg"),
] as const;
