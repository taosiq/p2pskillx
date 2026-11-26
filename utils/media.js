import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// Images are stored inline as compressed JPEG data URIs (Firestore docs max 1 MiB).
const MAX_DATA_URI_BYTES = 700 * 1024;

/** Pick a photo from the library. Returns { uri, dataUri } or null. */
export async function pickImage({ aspect = [4, 3], quality = 0.6, square = false } = {}) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photos access needed', 'Allow photo access in Settings to add a picture.');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: square ? [1, 1] : aspect,
    quality,
    base64: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  const dataUri = a.base64 ? `data:image/jpeg;base64,${a.base64}` : null;
  if (dataUri && dataUri.length > MAX_DATA_URI_BYTES) {
    Alert.alert('Image too large', 'Please choose a smaller image or crop it more.');
    return null;
  }
  return { uri: a.uri, dataUri };
}

/** Only allow images we trust to render: https URLs or inline data URIs. */
export const safeImageUri = (uri) =>
  typeof uri === 'string' && (/^https:\/\//.test(uri) || /^data:image\/(png|jpe?g|webp|gif);base64,/.test(uri)) ? uri : null;
