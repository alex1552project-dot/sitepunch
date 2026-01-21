/**
 * Policies Screen
 * View and acknowledge company policies
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import api from '../services/api';

export default function PoliciesScreen() {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const result = await api.getPolicies();
      if (result.success) {
        setPolicies(result.data.policies || []);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (policyId) => {
    setIsAcknowledging(true);
    try {
      const result = await api.acknowledgePolicy(policyId);
      if (result.success) {
        Alert.alert('Success', 'Policy acknowledged.');
        setSelectedPolicy(null);
        loadPolicies();
      } else {
        Alert.alert('Error', result.error || 'Failed to acknowledge policy.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderPolicy = ({ item }) => (
    <TouchableOpacity style={styles.policyCard} onPress={() => setSelectedPolicy(item)}>
      <View style={styles.policyHeader}>
        <Text style={styles.policyTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, item.acknowledged ? styles.statusAcknowledged : styles.statusPending]}>
          <Text style={styles.statusText}>{item.acknowledged ? '✓ Acknowledged' : 'Pending'}</Text>
        </View>
      </View>
      <Text style={styles.policyDescription} numberOfLines={2}>{item.description}</Text>
      {item.acknowledgedAt && (
        <Text style={styles.acknowledgedDate}>Acknowledged: {formatDate(item.acknowledgedAt)}</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const pendingCount = policies.filter((p) => !p.acknowledged).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Policies</Text>
        {pendingCount > 0 && (
          <Text style={styles.pendingText}>{pendingCount} pending acknowledgment</Text>
        )}
      </View>

      {/* Policies List */}
      {policies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No policies available</Text>
        </View>
      ) : (
        <FlatList
          data={policies}
          renderItem={renderPolicy}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Policy Detail Modal */}
      <Modal visible={!!selectedPolicy} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>{selectedPolicy?.title}</Text>
              <Text style={styles.modalDate}>
                Effective: {formatDate(selectedPolicy?.effectiveDate)}
              </Text>
              <Text style={styles.modalBody}>{selectedPolicy?.content}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              {!selectedPolicy?.acknowledged ? (
                <TouchableOpacity
                  style={[styles.acknowledgeBtn, isAcknowledging && styles.acknowledgeBtnDisabled]}
                  onPress={() => handleAcknowledge(selectedPolicy._id)}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.acknowledgeBtnText}>I Acknowledge This Policy</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.alreadyAcknowledged}>
                  <Text style={styles.alreadyAcknowledgedText}>✓ Already Acknowledged</Text>
                </View>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPolicy(null)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  pendingText: { fontSize: 14, color: '#fef3c7', marginTop: 4 },
  listContent: { padding: 16 },
  policyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  policyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  policyTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusAcknowledged: { backgroundColor: '#dcfce7' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  policyDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  acknowledgedDate: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalScroll: { padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  modalDate: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  modalBody: { fontSize: 16, color: '#374151', lineHeight: 24 },
  modalActions: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  acknowledgeBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  acknowledgeBtnDisabled: { opacity: 0.7 },
  acknowledgeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  alreadyAcknowledged: { backgroundColor: '#dcfce7', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  alreadyAcknowledgedText: { color: '#166534', fontSize: 16, fontWeight: '600' },
  closeBtn: { padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  closeBtnText: { color: '#6b7280', fontSize: 16, fontWeight: '500' },
});
