import { useTranslation } from "react-i18next";
import EkranSeShpejti from "../../components/EkranSeShpejti";
import { ikonat } from "../../components/Ikona";

// react-native-maps nuk punon në web; harta është vetëm në iOS dhe Android.
export default function Harta() {
  const { t } = useTranslation();
  return (
    <EkranSeShpejti ikona={ikonat.harta} titulli={t("harta.webTitulli")} teksti={t("harta.webTeksti")} />
  );
}
