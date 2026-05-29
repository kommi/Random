import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/theme';

const IDENTIFIER_TYPES = ['HALLMARK', 'VIN', 'IMEI', 'SERIAL', 'REGISTRATION', 'OTHER'] as const;

interface Identifier { type: string; value: string; }

export default function Step4Identifiers() {
  const router = useRouter();
  const { data: prevData } = useLocalSearchParams<{ data: string }>();
  const prev = prevData ? JSON.parse(prevData) : {};
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [currentType, setCurrentType] = useState<string>('SERIAL');
  const [currentValue, setCurrentValue] = useState('');

  const addIdentifier = () => {
    if (!currentValue.trim()) { Alert.alert('Error', 'Please enter an identifier value'); return; }
    setIdentifiers([...identifiers, { type: currentType, value: currentValue.trim() }]);
    setCurrentValue('');
  };

  const removeIdentifier = (index: number) => {
    setIdentifiers(identifiers.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    const data = JSON.stringify({ ...prev, identifiers });
    router.push({ pathname: '/(victim)/register-item/step5-confirm', params: { data } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Identifiers</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step <= 4 ? colors.primary : colors.border }} />
        ))}
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Unique Identifiers</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>
          Add serial numbers, IMEI, VIN, hallmark numbers, or other unique identifiers (optional).
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {IDENTIFIER_TYPES.map((type) => (
              <TouchableOpacity key={type} onPress={() => setCurrentType(type)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: currentType === type ? colors.primary : '#fff', borderWidth: 1, borderColor: currentType === type ? colors.primary : colors.border }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: currentType === type ? '#fff' : colors.text }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TextInput value={currentValue} onChangeText={setCurrentValue} placeholder="Enter identifier value" placeholderTextColor="#94A3B8" style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#fff' }} />
          <TouchableOpacity onPress={addIdentifier} style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add</Text>
          </TouchableOpacity>
        </View>
        {identifiers.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Added ({identifiers.length})</Text>
            {identifiers.map((id, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{id.type}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: colors.text }}>{id.value}</Text>
                <TouchableOpacity onPress={() => removeIdentifier(index)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 18, color: colors.danger, fontWeight: 'bold' }}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={handleNext} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Next: Review & Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
