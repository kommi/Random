import { View, Text } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  score: number;
  size?: number;
  band?: string;
}

export default function ThreatScoreBadge({ score, size = 80, band }: Props) {
  const getColor = () => {
    if (score >= 70) return colors.tpsRed;
    if (score >= 40) return colors.tpsAmber;
    return colors.tpsGreen;
  };
  const getBand = () => band || (score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');
  const color = getColor();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: color, justifyContent: 'center', alignItems: 'center', backgroundColor: `${color}15` }}>
        <Text style={{ fontSize: size * 0.3, fontWeight: 'bold', color }}>{Math.round(score)}</Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color, marginTop: 4 }}>{getBand()}</Text>
    </View>
  );
}
