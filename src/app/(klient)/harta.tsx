import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function Harta() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.harta}
      titulli={t("seShpejti.hartaTitulli")}
      teksti={t("seShpejti.hartaTeksti")}
      faza={2}
    />
  );
}
