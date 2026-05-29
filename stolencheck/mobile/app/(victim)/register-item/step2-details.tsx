import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/theme';

export default function Step2Details() {
  const router = useRouter();
  const { data: prevData } = useLocalSearchParams<{ data: string }>();
  const prev = prevData ? JSON.parse(prevData) : {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [itemColor, setItemColor] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [stolenAt, setStolenAt] = useState('');
  const [stolenLocation, setStolenLocation] = useState('');
  const [firNumber, setFirNumber] = useState('');

  const handleNext = () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title for the item'); return; }
    if (!stolenLocation.trim()) { Alert.alert('Error', 'Please enter the stolen location'); return; }
    const data = JSON.stringify({
      ...prev,
      title: title.trim(),
      description: description.trim(),
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      color: itemColor.trim() || undefined,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      stolenAt: stolenAt.trim() || new Date().toISOString(),
      stolenLocation: stolenLocation.trim(),
      firNumber: firNumber.trim() || undefined,
    });
    router.push({ pathname: '/(victim)/register-item/step3-photos', params: { data } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>&#8592; Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Item Details</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step <= 2 ? colors.primary : colors.border }} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Item Details</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>Provide details about the stolen {prev.category?.toLowerCase() || 'item'}</Text>

          <FormField label="Title *" value={title} onChange={setTitle} placeholder="e.g., Gold Necklace with Ruby Pendant" />
          <FormField label="Description" value={description} onChange={setDescription} placeholder="Detailed description of the item..." multiline />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Brand" value={brand} onChange={setBrand} placeholder="e.g., Samsung" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Model" value={model} onChange={setModel} placeholder="e.g., Galaxy S24" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Color" value={itemColor} onChange={setItemColor} placeholder="e.g., Gold" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Est. Value ($)" value={estimatedValue} onChange={setEstimatedValue} placeholder="50000" keyboardType="numeric" />
            </View>
          </View>
          <FormField label="Date Stolen (YYYY-MM-DD)" value={stolenAt} onChange={setStolenAt} placeholder="2024-01-15" />
          <FormField label="Stolen Location *" value={stolenLocation} onChange={setStolenLocation} placeholder="Address or area description" />
          <FormField label="FIR / Police Report Number" value={firNumber} onChange={setFirNumber} placeholder="e.g., FIR-2024-12345" />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Next Button */}
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={handleNext} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Next: Add Photos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; multiline?: boolean; keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: 12,
          padding: 14, fontSize: 15, color: colors.text,
          backgroundColor: '#fff',
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  );
}
