import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageUploader from '../../../components/ImageUploader';
import { colors } from '../../../constants/theme';

export default function Step3Photos() {
  const router = useRouter();
  const { data: prevData } = useLocalSearchParams<{ data: string }>();
  const prev = prevData ? JSON.parse(prevData) : {};
  const [images, setImages] = useState<string[]>([]);

  const handleNext = () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }
    const data = JSON.stringify({ ...prev, images });
    router.push({ pathname: '/(victim)/register-item/step4-identifiers', params: { data } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Add Photos</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: step <= 3 ? colors.primary : colors.border }} />
        ))}
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Photos</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>
          Add clear photos of the stolen item. Multiple angles help with matching.
        </Text>
        <ImageUploader images={images} onImagesChange={setImages} maxImages={5} />
      </View>
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={images.length === 0}
          style={{ backgroundColor: images.length > 0 ? colors.primary : '#CBD5E1', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Next: Add Identifiers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
