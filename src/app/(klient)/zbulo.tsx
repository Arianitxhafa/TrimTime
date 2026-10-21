import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

export default function Zbulo() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti
      ikona={ikonat.zbulo}
      titulli={t("seShpejti.zbuloTitulli")}
      teksti={t("seShpejti.zbuloTeksti")}
      faza={2}
    />
  );
}
