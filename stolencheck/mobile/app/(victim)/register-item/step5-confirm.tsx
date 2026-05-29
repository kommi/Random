import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../../api/client';
import { colors } from '../../../constants/theme';

export default function Step5Confirm() {
  const router = useRouter();
  const { data: prevData } = useLocalSearchParams<{ data: string }>();
  const itemData = prevData ? JSON.parse(prevData) : {};
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      const { images, ...rest } = itemData;
      formData.append('itemData', JSON.stringify(rest));
      if (images) {
        for (let i = 0; i < images.length; i++) {
          formData.append('images', { uri: images[i], name: `photo_${i}.jpg`, type: 'image/jpeg' } as any);
        }
      }
      await client.post('/items/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success', 'Your stolen item has been registered.', [
        { text: 'OK', onPress: () => router.replace('/(victim)/dashboard') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text }}>Review</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 6 }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View key={step} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
        ))}
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Review & Submit</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>Please review before submitting.</Text>
        <Section title="Category">
          <Text style={{ fontSize: 15, color: colors.text }}>{itemData.category}</Text>
        </Section>
        <Section title="Details">
          <DetailRow label="Title" value={itemData.title} />
          {itemData.description && <DetailRow label="Description" value={itemData.description} />}
          {itemData.brand && <DetailRow label="Brand" value={itemData.brand} />}
          {itemData.model && <DetailRow label="Model" value={itemData.model} />}
          {itemData.color && <DetailRow label="Color" value={itemData.color} />}
          {itemData.estimatedValue && <DetailRow label="Est. Value" value={`${itemData.estimatedValue}`} />}
          <DetailRow label="Stolen Date" value={itemData.stolenAt || 'Not specified'} />
          <DetailRow label="Location" value={itemData.stolenLocation} />
          {itemData.firNumber && <DetailRow label="FIR Number" value={itemData.firNumber} />}
        </Section>
        {itemData.images?.length > 0 && (
          <Section title={`Photos (${itemData.images.length})`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {itemData.images.map((uri: string, i: number) => (
                  <Image key={i} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 10 }} />
                ))}
              </View>
            </ScrollView>
          </Section>
        )}
        {itemData.identifiers?.length > 0 && (
          <Section title={`Identifiers (${itemData.identifiers.length})`}>
            {itemData.identifiers.map((id: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, width: 100 }}>{id.type}</Text>
                <Text style={{ fontSize: 13, color: colors.text }}>{id.value}</Text>
              </View>
            ))}
          </Section>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <View style={{ padding: 20 }}>
        <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{ backgroundColor: colors.success, borderRadius: 12, padding: 16, alignItems: 'center' }}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Submit Report</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary, width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.text, flex: 1 }}>{value}</Text>
    </View>
  );
}
