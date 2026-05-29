import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import client from '../../../api/client';
import { colors, spacing, fontSize } from '../../../constants/theme';

type VerifyResult = {
  match: boolean;
  confidence?: number;
  item?: any;
  message?: string;
};

export default function ScanScreen() {
  const [mode, setMode] = useState<'image' | 'id'>('image');
  const [idType, setIdType] = useState('SERIAL');
  const [idValue, setIdValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({});
      return { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const verifyByImage = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select or take a photo first');
      return;
    }
    setLoading(true);
    try {
      const location = await getLocation();
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'scan.jpg',
      } as any);
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
      }
      const { data } = await client.post('/verify/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyById = async () => {
    if (!idValue.trim()) {
      Alert.alert('Error', 'Please enter an ID value');
      return;
    }
    setLoading(true);
    try {
      const location = await getLocation();
      const { data } = await client.post('/verify/id', {
        type: idType,
        value: idValue.trim(),
        ...(location || {}),
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = () => {
    if (!result) return colors.primary;
    return result.match ? colors.danger : colors.success;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.xs, marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => { setMode('image'); setResult(null); }}
            style={{ flex: 1, padding: spacing.sm, borderRadius: 10, backgroundColor: mode === 'image' ? colors.primary : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ color: mode === 'image' ? '#FFF' : colors.text, fontWeight: '600', fontSize: fontSize.sm }}>
              Photo Scan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMode('id'); setResult(null); }}
            style={{ flex: 1, padding: spacing.sm, borderRadius: 10, backgroundColor: mode === 'id' ? colors.primary : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ color: mode === 'id' ? '#FFF' : colors.text, fontWeight: '600', fontSize: fontSize.sm }}>
              ID Lookup
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'image' ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
              Scan by Photo
            </Text>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: spacing.md }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ height: 200, backgroundColor: colors.background, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border }}>
                <Text style={{ fontSize: fontSize.xxl }}>📷</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm }}>
                  Take or select a photo of the item
                </Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={pickImage}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: fontSize.sm }}>Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={verifyByImage}
              disabled={loading || !selectedImage}
              style={{ backgroundColor: loading ? colors.primaryLight : colors.warning, borderRadius: 8, padding: spacing.md, alignItems: 'center', marginTop: spacing.md }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.md }}>Verify Item</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
              Lookup by ID
            </Text>

            <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>ID Type</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
              {['SERIAL', 'IMEI', 'VIN', 'CUSTOM'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setIdType(type)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 20,
                    backgroundColor: idType === type ? colors.primary : colors.background,
                  }}
                >
                  <Text style={{ color: idType === type ? '#FFF' : colors.text, fontSize: fontSize.xs, fontWeight: '600' }}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>ID Value</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text, fontSize: fontSize.md }}
              value={idValue}
              onChangeText={setIdValue}
              placeholder="Enter serial, IMEI, or VIN number"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              onPress={verifyById}
              disabled={loading || !idValue.trim()}
              style={{ backgroundColor: loading ? colors.primaryLight : colors.warning, borderRadius: 8, padding: spacing.md, alignItems: 'center' }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.md }}>Check ID</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: spacing.lg,
            borderWidth: 2,
            borderColor: getResultColor(),
          }}>
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: 48 }}>{result.match ? '🚨' : '✅'}</Text>
              <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: getResultColor(), marginTop: spacing.sm }}>
                {result.match ? 'MATCH FOUND' : 'NO MATCH'}
              </Text>
              {result.confidence !== undefined && (
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                  Confidence: {Math.round(result.confidence * 100)}%
                </Text>
              )}
            </View>

            {result.match && result.item && (
              <View style={{ backgroundColor: colors.dangerLight, borderRadius: 8, padding: spacing.md }}>
                <Text style={{ fontWeight: '600', color: colors.danger, marginBottom: spacing.xs }}>
                  WARNING: This item may be stolen
                </Text>
                <Text style={{ color: colors.text, fontSize: fontSize.sm }}>
                  {result.item.title} - {result.item.category}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs }}>
                  SCID: {result.item.scid}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 }}>
                  Do not proceed with the purchase. Contact local authorities.
                </Text>
              </View>
            )}

            {!result.match && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: fontSize.sm }}>
                {result.message || 'This item was not found in the stolen items database.'}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
