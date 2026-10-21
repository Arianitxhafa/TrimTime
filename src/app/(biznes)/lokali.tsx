import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function Lokali() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.lokali}
      titulli={t("seShpejti.lokaliTitulli")}
      teksti={t("seShpejti.lokaliTeksti")}
      faza={2}
    />
  );
}
