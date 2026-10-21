import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function TermineteMia() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.kalendar}
      titulli={t("seShpejti.termineteMiaTitulli")}
      teksti={t("seShpejti.termineteMiaTeksti")}
      faza={3}
    />
  );
}
