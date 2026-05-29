import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/theme';

const CATEGORIES = [
  { value: 'GOLD', label: 'Gold & Jewelry', icon: '&#128142;', desc: 'Gold ornaments, necklaces, rings, etc.' },
  { value: 'VEHICLE', label: 'Vehicle', icon: '&#128663;', desc: 'Cars, bikes, scooters, trucks' },
  { value: 'ELECTRONICS', label: 'Electronics', icon: '&#128241;', desc: 'Phones, laptops, tablets, cameras' },
  { value: 'ACCESSORIES', label: 'Accessories', icon: '&#8986;', desc: 'Watches, bags, sunglasses' },
  { value: 'OTHER', label: 'Other', icon: '&#128230;', desc: 'Documents, tools, miscellaneous' },
];

export default function Step1Category() {
  const [selected, setSelected] = useState('');
  const router = useRouter();

  const handleNext = () => {
    if (!selected) return;
    const data = JSON.stringify({ category: selected });
    router.push({ pathname: '/(victim)/register-item/step2-details', params: { data } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Register Item</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step === 1 ? colors.primary : colors.border }} />
        ))}
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Select Category</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>What type of item was stolen?</Text>

        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setSelected(cat.value)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: selected === cat.value ? '#EFF6FF' : '#fff',
              borderWidth: 2, borderColor: selected === cat.value ? colors.primary : colors.border,
              borderRadius: 16, padding: 18, marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 14 }}>{cat.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: selected === cat.value ? colors.primary : colors.text }}>{cat.label}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{cat.desc}</Text>
            </View>
            {selected === cat.value && (
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>&#10003;</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Next Button */}
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!selected}
          style={{ backgroundColor: selected ? colors.primary : '#CBD5E1', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Next: Item Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
