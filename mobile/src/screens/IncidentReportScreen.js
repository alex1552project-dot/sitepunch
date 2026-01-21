/**
 * Incident Report Screen
 * Report workplace incidents with photos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';

const INCIDENT_TYPES = [
  { id: 'injury', label: '🤕 Injury' },
  { id: 'near_miss', label: '⚠️ Near Miss' },
  { id: 'property_damage', label: '🔧 Property Damage' },
  { id: 'safety_hazard', label: '🚧 Safety Hazard' },
  { id: 'vehicle', label: '🚗 Vehicle' },
  { id: 'other', label: '📝 Other' },
];

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
];

export default function IncidentReportScreen({ navigation }) {
  const [incidentType, setIncidentType] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to take incident photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please enable photo library access to attach photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  const addPhoto = () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 photos per incident.');
      return;
    }

    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const captureGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Location Captured', `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location.');
    }
  };

  const handleSubmit = async () => {
    if (!incidentType) {
      Alert.alert('Required', 'Please select an incident type.');
      return;
    }
    if (!severity) {
      Alert.alert('Required', 'Please select severity level.');
      return;
    }
    if (!description.trim() || description.length < 20) {
      Alert.alert('Required', 'Please provide a detailed description (at least 20 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.reportIncident({
        incidentType,
        severity,
        description: description.trim(),
        location: location.trim(),
        gpsLocation,
        photos: photos.map((p) => p.base64),
        reportedAt: new Date().toISOString(),
      });

      if (result.success) {
        Alert.alert('Report Submitted', 'Your incident report has been submitted.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report Incident</Text>
      </View>

      <View style={styles.content}>
        {/* Incident Type */}
        <Text style={styles.label}>Incident Type *</Text>
        <View style={styles.typeGrid}>
          {INCIDENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeBtn, incidentType === type.id && styles.typeBtnActive]}
              onPress={() => setIncidentType(type.id)}
            >
              <Text style={styles.typeBtnText}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Severity */}
        <Text style={styles.label}>Severity *</Text>
        <View style={styles.severityRow}>
          {SEVERITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.severityBtn,
                { borderColor: level.color },
                severity === level.id && { backgroundColor: level.color },
              ]}
              onPress={() => setSeverity(level.id)}
            >
              <Text style={[styles.severityText, severity === level.id && { color: '#fff' }]}>
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe what happened..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Where did it happen?"
          placeholderTextColor="#9ca3af"
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.gpsBtn} onPress={captureGPS}>
          <Text style={styles.gpsBtnText}>
            {gpsLocation ? '📍 GPS Captured' : '📍 Capture GPS Location'}
          </Text>
        </TouchableOpacity>

        {/* Photos */}
        <Text style={styles.label}>Photos ({photos.length}/5)</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <TouchableOpacity key={index} onPress={() => removePhoto(index)}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <View style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </View>
            </TouchableOpacity>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addPhoto}>
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Text style={styles.safetyText}>⚠️ If this is a medical emergency, call 911 immediately.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  typeBtnActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  typeBtnText: { fontSize: 14, color: '#374151' },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  severityText: { fontWeight: '600', color: '#374151' },
  textArea: { backgroundColor: '#fff', borderRadius: 8, padding: 12, minHeight: 100, borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' },
  gpsBtn: { marginTop: 8, padding: 10, backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center' },
  gpsBtnText: { color: '#374151', fontWeight: '500' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  addPhotoBtn: { width: 80, height: 80, backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d1d5db', borderStyle: 'dashed' },
  addPhotoIcon: { fontSize: 24 },
  addPhotoText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  safetyNote: { marginTop: 16, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  safetyText: { color: '#991b1b', fontSize: 14 },
});
