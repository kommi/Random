import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import client from '../../../api/client';
import { colors, spacing, fontSize } from '../../../constants/theme';

const CATEGORIES = ['Electronics', 'Jewelry', 'Vehicle', 'Document', 'Clothing', 'Other'];

export default function RegisterItemScreen() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [stolenLocation, setStolenLocation] = useState('');
  const [firNumber, setFirNumber] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !stolenLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      images.forEach((img, idx) => {
        formData.append('images', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `photo_${idx}.jpg`,
        } as any);
      });

      const itemData = {
        title,
        category,
        description,
        brand: brand || undefined,
        model: model || undefined,
        color: color || undefined,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        stolenLocation,
        firNumber: firNumber || undefined,
        identifiers: serialNumber ? [{ type: 'SERIAL', value: serialNumber }] : [],
      };

      formData.append('itemData', JSON.stringify(itemData));

      await client.post('/items/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Stolen item has been registered', [
        { text: 'OK', onPress: () => resetForm() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to register item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Electronics');
    setDescription('');
    setBrand('');
    setModel('');
    setColor('');
    setEstimatedValue('');
    setSerialNumber('');
    setStolenLocation('');
    setFirNumber('');
    setImages([]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg }}>
        {/* Images */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            Photos
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {images.map((img, idx) => (
              <TouchableOpacity key={idx} onPress={() => removeImage(idx)}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: colors.danger, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>X</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TouchableOpacity
              onPress={takePhoto}
              style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontSize: fontSize.sm, fontWeight: '600' }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              style={{ flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' }}
            >
              <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Item details */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            Item Details
          </Text>

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Title *</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., iPhone 15 Pro Max"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 20,
                    backgroundColor: category === cat ? colors.primary : colors.background,
                  }}
                >
                  <Text style={{ color: category === cat ? '#FFF' : colors.text, fontSize: fontSize.sm }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Description *</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, minHeight: 80, textAlignVertical: 'top', color: colors.text }}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of the item"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Brand</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
                value={brand}
                onChangeText={setBrand}
                placeholder="Apple"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Model</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
                value={model}
                onChangeText={setModel}
                placeholder="iPhone 15"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Color</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
                value={color}
                onChangeText={setColor}
                placeholder="Black"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Value ($)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
                value={estimatedValue}
                onChangeText={setEstimatedValue}
                placeholder="1000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Serial / IMEI Number</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Serial or IMEI number"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Incident details */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.md }}>
            Incident Details
          </Text>

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>Location of theft *</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, marginBottom: spacing.md, color: colors.text }}
            value={stolenLocation}
            onChangeText={setStolenLocation}
            placeholder="Address where item was stolen"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs }}>FIR / Police Report Number</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, color: colors.text }}
            value={firNumber}
            onChangeText={setFirNumber}
            placeholder="FIR-2024-XXXX"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.primaryLight : colors.danger,
            borderRadius: 12,
            padding: spacing.md,
            alignItems: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: fontSize.md, fontWeight: '600' }}>
            {loading ? 'Submitting...' : 'Register Stolen Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
