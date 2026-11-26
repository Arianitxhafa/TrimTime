import Svg, { Circle, Text as SvgText } from "react-native-svg";

type Props = {
  madhesia?: number;
};

// Logoja e Studio Burimit, si në Instagram: rreth i zi, "STUDIO" e hapur dhe "BURIMI" e trashë.
// Unaza e bardhë e mban të dukshme edhe mbi sfondin e zi.
export default function LogoStudio({ madhesia = 88 }: Props) {
  return (
    <Svg width={madhesia} height={madhesia} viewBox="0 0 200 200" accessibilityLabel="Studio Burimi">
      <Circle cx={100} cy={100} r={97} fill="#0A0A0A" stroke="#F4F1EA" strokeWidth={4} />
      <SvgText
        x={100}
        y={84}
        fill="#F4F1EA"
        fontSize={17}
        fontWeight="600"
        letterSpacing={9}
        textAnchor="middle"
      >
        STUDIO
      </SvgText>
      <SvgText x={100} y={128} fill="#F4F1EA" fontSize={46} fontWeight="900" letterSpacing={1} textAnchor="middle">
        BURIMI
      </SvgText>
      <Circle cx={100} cy={152} r={3} fill="#E5484D" />
    </Svg>
  );
}
