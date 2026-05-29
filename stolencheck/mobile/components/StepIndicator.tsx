import { View, Text } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function StepIndicator({ currentStep, totalSteps, labels }: Props) {
  return (
    <View style={{ paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i < currentStep ? colors.primary : i === currentStep ? colors.primaryLight : colors.border, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: i <= currentStep ? '#fff' : colors.textSecondary }}>{i + 1}</Text>
            </View>
            {i < totalSteps - 1 && <View style={{ width: 24, height: 2, backgroundColor: i < currentStep ? colors.primary : colors.border }} />}
          </View>
        ))}
      </View>
      {labels && labels[currentStep] && (
        <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>{labels[currentStep]}</Text>
      )}
    </View>
  );
}
