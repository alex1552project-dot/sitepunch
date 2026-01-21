/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0] || ''}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.role}>{user?.role || 'Employee'}</Text>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <InfoRow label="Employee ID" value={user?.employeeId} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Phone" value={user?.phone} />
        <InfoRow label="Department" value={user?.department} />
        <InfoRow label="Start Date" value={user?.startDate ? new Date(user.startDate).toLocaleDateString() : null} />
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('TimeOff')}>
          <Text style={styles.actionIcon}>🏖️</Text>
          <Text style={styles.actionText}>Request Time Off</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Time History')}>
          <Text style={styles.actionIcon}>⏱️</Text>
          <Text style={styles.actionText}>View Time History</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Policies')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Company Policies</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Support</Text>
        
        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionIcon}>❓</Text>
          <Text style={styles.actionText}>Help & FAQ</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow}>
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionText}>Contact Support</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>SitePunch v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  role: { fontSize: 16, color: '#bfdbfe', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 16, color: '#6b7280' },
  infoValue: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1, fontSize: 16, color: '#1f2937' },
  actionArrow: { fontSize: 20, color: '#9ca3af' },
  logoutBtn: { margin: 16, padding: 16, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginVertical: 16 },
});
