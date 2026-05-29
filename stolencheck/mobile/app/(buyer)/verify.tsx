import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import client from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';
import ThreatScoreBadge from '../../components/ThreatScoreBadge';
import MatchCard from '../../components/MatchCard';

type Tab = 'photo' | 'id' | 'search';
const ID_TYPES = ['HALLMARK', 'VIN', 'IMEI', 'SERIAL', 'REGISTRATION', 'OTHER'] as const;

export default function Verify() {
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.primary }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>StoleCheck</Text>
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/'); }}>
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {([['photo', 'Scan Photo'], ['id', 'Check ID'], ['search', 'Search']] as [Tab, string][]).map(([tab, label]) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? colors.primary : 'transparent' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === tab ? colors.primary : colors.textSecondary }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'photo' && <PhotoTab />}
      {activeTab === 'id' && <IdTab />}
      {activeTab === 'search' && <SearchTab />}
    </SafeAreaView>
  );
}

function PhotoTab() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed'); return; }
    const res = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const scan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      let latitude: number | undefined, longitude: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
        }
      } catch {}
      const formData = new FormData();
      formData.append('image', { uri: image, name: 'scan.jpg', type: 'image/jpeg' } as any);
      if (latitude) formData.append('latitude', String(latitude));
      if (longitude) formData.append('longitude', String(longitude));
      const { data } = await client.post('/verify/image', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      setResult(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Scan failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {!image ? (
        <View style={{ gap: 12, marginTop: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 8 }}>Scan an item to check</Text>
          <TouchableOpacity onPress={() => pickImage(true)} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickImage(false)} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 16, marginBottom: 16 }} />
          {!result && (
            <View style={{ gap: 10 }}>
              <TouchableOpacity onPress={scan} disabled={loading} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Scan Now</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setImage(null); setResult(null); }} style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Choose different photo</Text>
              </TouchableOpacity>
            </View>
          )}
          {result && <ResultView result={result} onReset={() => { setImage(null); setResult(null); }} />}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function IdTab() {
  const [idType, setIdType] = useState<string>('SERIAL');
  const [idValue, setIdValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const check = async () => {
    if (!idValue.trim()) { Alert.alert('Error', 'Enter an identifier value'); return; }
    setLoading(true);
    try {
      const { data } = await client.post('/verify/id', { type: idType, value: idValue.trim() });
      setResult(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Check failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Check by Identifier</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {ID_TYPES.map((type) => (
            <TouchableOpacity key={type} onPress={() => setIdType(type)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: idType === type ? colors.primary : '#fff', borderWidth: 1, borderColor: idType === type ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: idType === type ? '#fff' : colors.text }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TextInput value={idValue} onChangeText={setIdValue} placeholder="Enter identifier value" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#fff', marginBottom: 16 }} />
      <TouchableOpacity onPress={check} disabled={loading} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Check Identifier</Text>}
      </TouchableOpacity>
      {result && <View style={{ marginTop: 20 }}><ResultView result={result} onReset={() => { setResult(null); setIdValue(''); }} /></View>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SearchTab() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim() && !category) return;
    setLoading(true);
    try {
      const params: any = {};
      if (query.trim()) params.q = query.trim();
      if (category) params.category = category;
      const { data } = await client.get('/verify/search', { params });
      setResults(data.items || []);
    } catch {
      Alert.alert('Error', 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Search Database</Text>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search by title, SCID, brand..." placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, backgroundColor: '#fff', marginBottom: 12 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['', 'GOLD', 'VEHICLE', 'ELECTRONICS', 'ACCESSORIES', 'OTHER'].map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: category === cat ? colors.primary : '#fff', borderWidth: 1, borderColor: category === cat ? colors.primary : colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? '#fff' : colors.text }}>{cat || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={search} disabled={loading} style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Search</Text>}
      </TouchableOpacity>
      {results.map((item, i) => (
        <View key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{item.title}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.scid} | {item.category}</Text>
          {item.brand && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.brand} {item.color ? `| ${item.color}` : ''}</Text>}
        </View>
      ))}
      {results.length === 0 && !loading && query && <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No results found</Text>}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ResultView({ result, onReset }: { result: any; onReset: () => void }) {
  const urgencyInfo: Record<string, { color: string; msg: string }> = {
    GREEN: { color: colors.tpsGreen, msg: 'This item appears clean.' },
    YELLOW: { color: colors.tpsAmber, msg: 'Low confidence match. Likely safe.' },
    AMBER: { color: colors.tpsAmber, msg: 'Proceed with caution. Moderate match found.' },
    RED: { color: colors.tpsRed, msg: 'DO NOT PURCHASE. High probability stolen.' },
  };
  const info = urgencyInfo[result.urgencyLevel] || urgencyInfo.GREEN;
  return (
    <View>
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <ThreatScoreBadge score={result.overallTPS} size={100} band={result.urgencyLevel} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: info.color, marginTop: 12, textAlign: 'center' }}>{info.msg}</Text>
        {result.alertCreated && <Text style={{ fontSize: 13, color: colors.danger, marginTop: 6, fontWeight: '600' }}>Law enforcement has been notified.</Text>}
      </View>
      {result.matches?.map((match: any, i: number) => <MatchCard key={i} match={match} />)}
      <TouchableOpacity onPress={onReset} style={{ padding: 14, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Scan Another Item</Text>
      </TouchableOpacity>
    </View>
  );
}
