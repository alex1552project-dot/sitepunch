/**
 * Time Off Screen
 * Request and view time off
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import api from '../services/api';

const TIME_OFF_TYPES = [
  { id: 'vacation', label: '🏖️ Vacation' },
  { id: 'sick', label: '🤒 Sick Leave' },
  { id: 'personal', label: '👤 Personal' },
  { id: 'bereavement', label: '🕊️ Bereavement' },
  { id: 'other', label: '📝 Other' },
];

export default function TimeOffScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const result = await api.getTimeOffRequests();
      if (result.success) {
        setRequests(result.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setType(null);
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleSubmit = async () => {
    if (!type) {
      Alert.alert('Required', 'Please select a type.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Required', 'Please enter start and end dates.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.requestTimeOff({ type, startDate, endDate, reason: reason.trim() });
      if (result.success) {
        Alert.alert('Success', 'Time off request submitted.');
        setShowForm(false);
        resetForm();
        loadRequests();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit request.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (requestId) => {
    Alert.alert('Cancel Request', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          const result = await api.cancelTimeOffRequest(requestId);
          if (result.success) loadRequests();
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'denied': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Time Off</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.newBtnText}>+ Request Time Off</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Requests</Text>
        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{TIME_OFF_TYPES.find((t) => t.id === item.type)?.label || item.type}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDates}>{formatDate(item.startDate)} - {formatDate(item.endDate)}</Text>
              {item.status === 'pending' && (
                <TouchableOpacity onPress={() => handleCancel(item._id)}>
                  <Text style={styles.cancelText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Time Off</Text>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeGrid}>
              {TIME_OFF_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeBtn, type === t.id && styles.typeBtnActive]}
                  onPress={() => setType(t.id)}
                >
                  <Text>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-01-20" value={startDate} onChangeText={setStartDate} />

            <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2026-01-22" value={endDate} onChangeText={setEndDate} />

            <Text style={styles.label}>Reason (optional)</Text>
            <TextInput style={styles.input} placeholder="Reason" value={reason} onChangeText={setReason} />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60 },
  backBtn: { color: '#bfdbfe', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  newBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  newBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#6b7280', marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardType: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  cardDates: { color: '#6b7280' },
  cancelText: { color: '#ef4444', marginTop: 8, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#2563eb' },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16 },
  submitBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#6b7280', fontSize: 16 },
});
