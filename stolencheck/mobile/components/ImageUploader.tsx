import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/theme';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onImagesChange, maxImages = 5 }: Props) {
  const pickImage = async (useCamera: boolean) => {
    if (images.length >= maxImages) {
      Alert.alert('Limit reached', `Maximum ${maxImages} images allowed`);
      return;
    }
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', `Please grant ${useCamera ? 'camera' : 'gallery'} access`);
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsMultipleSelection: true, selectionLimit: maxImages - images.length });
    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      onImagesChange([...images, ...newImages].slice(0, maxImages));
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
        {images.map((uri, index) => (
          <View key={index} style={{ position: 'relative' }}>
            <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
            <TouchableOpacity onPress={() => removeImage(index)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < maxImages && (
          <View style={{ gap: 8 }}>
            <TouchableOpacity onPress={() => pickImage(true)} style={{ width: 100, height: 46, borderRadius: 12, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} style={{ width: 100, height: 46, borderRadius: 12, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{images.length}/{maxImages} photos</Text>
    </View>
  );
}
