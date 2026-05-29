import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacing, fontSize } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const variants = {
    primary: { bg: colors.primary, text: '#FFFFFF', border: colors.primary },
    secondary: { bg: colors.textSecondary, text: '#FFFFFF', border: colors.textSecondary },
    danger: { bg: colors.danger, text: '#FFFFFF', border: colors.danger },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary },
  };

  const v = variants[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: disabled ? colors.border : v.bg,
          borderRadius: 8,
          padding: spacing.md,
          alignItems: 'center' as const,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: v.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={{ color: disabled ? colors.textSecondary : v.text, fontSize: fontSize.md, fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
