import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function Kalendari() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.kalendar}
      titulli={t("seShpejti.kalendariTitulli")}
      teksti={t("seShpejti.kalendariTeksti")}
      faza={4}
    />
  );
}
