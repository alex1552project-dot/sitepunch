/**
 * Home Screen - SitePunch
 * Clock In/Out with GPS tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Linking,
  Platform,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const logo = require('../assets/sitepunch-logo.png');

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  
  const [clockStatus, setClockStatus] = useState({
    isClockedIn: false,
    currentEntry: null,
    currentDuration: null,
  });
  const [payPeriod, setPayPeriod] = useState({
    totalHours: 0,
    overtimeThreshold: 40,
  });
  const [pendingPolicies, setPendingPolicies] = useState([]);

  useEffect(() => {
    checkLocationPermission();
    loadData();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'undetermined') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(newStatus);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const statusResult = await api.getCurrentStatus();
      if (statusResult.success) {
        setClockStatus(statusResult.data);
      }

      const summaryResult = await api.getPayPeriodSummary();
      if (summaryResult.success) {
        setPayPeriod(summaryResult.data);
      }

      const pendingResult = await api.getPendingAcknowledgments();
      if (pendingResult.success) {
        setPendingPolicies(pendingResult.data.pending || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkLocationPermission();
    await loadData();
    setRefreshing(false);
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'undetermined') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        setLocationPermission(status);
      }
      
      if (status !== 'granted') {
        setLocationPermission(status);
        Alert.alert(
          'Location Permission Required',
          'SitePunch needs your location to verify clock in/out. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log('GPS Location captured:', location.coords);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please ensure GPS is enabled.');
      return null;
    }
  };

  const handleClockIn = async () => {
    if (pendingPolicies.length > 0) {
      Alert.alert('Acknowledgment Required', 'Please acknowledge required policies before clocking in.');
      return;
    }

    setIsClockingIn(true);
    try {
      const location = await getLocation();
      if (!location) {
        setIsClockingIn(false);
        return;
      }

      const result = await api.clockIn(location);

      if (result.success) {
        await loadData();
        Alert.alert('Success', `Clocked in!\nLocation: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to clock in');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    setIsClockingOut(true);
    try {
      const location = await getLocation();
      if (!location) {
        setIsClockingOut(false);
        return;
      }

      const result = await api.clockOut(location);

      if (result.success) {
        await loadData();
        Alert.alert('Clocked Out', 'Any injuries or incidents to report?', [
          { text: 'No', style: 'cancel' },
          { text: 'Report Incident', onPress: () => navigation.navigate('ReportIncident') },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to clock out');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsClockingOut(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>SitePunch</Text>
        </View>
        <Text style={styles.greeting}>Hello, {user?.firstName || 'Team Member'}! 👋</Text>
        <Text style={styles.date}>{dateString}</Text>
      </View>

      {/* Location Warning */}
      {locationPermission === 'denied' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>📍 Location Required</Text>
          <Text style={styles.warningText}>Enable location to clock in/out.</Text>
          <TouchableOpacity style={styles.warningBtn} onPress={openSettings}>
            <Text style={styles.warningBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clock Status */}
      <View style={[styles.statusCard, clockStatus.isClockedIn && styles.statusCardActive]}>
        <Text style={styles.statusText}>{clockStatus.isClockedIn ? 'Clocked In' : 'Not Clocked In'}</Text>
        {clockStatus.isClockedIn && clockStatus.currentDuration && (
          <Text style={styles.durationText}>Working: {formatDuration(clockStatus.currentDuration.minutes)}</Text>
        )}
      </View>

      {/* Clock Button */}
      <TouchableOpacity
        style={[styles.clockBtn, clockStatus.isClockedIn ? styles.clockOutBtn : styles.clockInBtn]}
        onPress={clockStatus.isClockedIn ? handleClockOut : handleClockIn}
        disabled={isClockingIn || isClockingOut}
      >
        {(isClockingIn || isClockingOut) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.clockBtnText}>
            {clockStatus.isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Pay Period */}
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>This Pay Period</Text>
        <Text style={styles.statsValue}>{payPeriod.totalHours?.toFixed(1) || '0.0'} hours</Text>
      </View>

      {/* Pending Policies */}
      {pendingPolicies.length > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Action Required</Text>
          <Text style={styles.alertText}>{pendingPolicies.length} policy acknowledgment(s) pending</Text>
          <TouchableOpacity style={styles.alertBtn} onPress={() => navigation.navigate('Policies')}>
            <Text style={styles.alertBtnText}>Review Policies</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1419' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1419' },
  header: { backgroundColor: '#1a1f2e', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2d3748' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerLogo: { width: 40, height: 40, marginRight: 10 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#3b82f6' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9' },
  date: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  warningCard: { margin: 20, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b' },
  warningTitle: { fontSize: 16, fontWeight: '600', color: '#f59e0b' },
  warningText: { fontSize: 14, color: '#fbbf24', marginTop: 4 },
  warningBtn: { marginTop: 12, backgroundColor: '#f59e0b', padding: 10, borderRadius: 8, alignItems: 'center' },
  warningBtnText: { color: '#fff', fontWeight: '600' },
  statusCard: { margin: 20, padding: 24, backgroundColor: '#1a1f2e', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2d3748' },
  statusCardActive: { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e', borderWidth: 2 },
  statusText: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9' },
  durationText: { fontSize: 16, color: '#94a3b8', marginTop: 8 },
  clockBtn: { marginHorizontal: 20, padding: 20, borderRadius: 12, alignItems: 'center' },
  clockInBtn: { backgroundColor: '#22c55e' },
  clockOutBtn: { backgroundColor: '#ef4444' },
  clockBtnText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  statsCard: { margin: 20, padding: 24, backgroundColor: '#1a1f2e', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748' },
  statsLabel: { fontSize: 14, color: '#94a3b8' },
  statsValue: { fontSize: 36, fontWeight: 'bold', color: '#f1f5f9', marginTop: 4 },
  alertCard: { margin: 20, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: 12, borderWidth: 1, borderColor: '#f59e0b' },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#f59e0b' },
  alertText: { fontSize: 14, color: '#fbbf24', marginTop: 4 },
  alertBtn: { marginTop: 12, backgroundColor: '#f59e0b', padding: 12, borderRadius: 8, alignItems: 'center' },
  alertBtnText: { color: '#fff', fontWeight: '600' },
});
