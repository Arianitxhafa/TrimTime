import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function Klientet() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.klientet}
      titulli={t("seShpejti.klientetTitulli")}
      teksti={t("seShpejti.klientetTeksti")}
      faza={4}
    />
  );
}
