/**
 * Time History Screen
 * Shows past time entries
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../services/api';

export default function TimeHistoryScreen() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const result = await api.getTimeEntries();
      if (result.success) {
        setEntries(result.data.entries || []);
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const renderEntry = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{formatDate(item.clockIn)}</Text>
        <Text style={[styles.entryStatus, item.clockOut ? styles.statusComplete : styles.statusActive]}>
          {item.clockOut ? 'Complete' : 'Active'}
        </Text>
      </View>
      
      <View style={styles.entryTimes}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Clock In</Text>
          <Text style={styles.timeValue}>{formatTime(item.clockIn)}</Text>
        </View>
        
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Clock Out</Text>
          <Text style={styles.timeValue}>{item.clockOut ? formatTime(item.clockOut) : '-'}</Text>
        </View>
        
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Duration</Text>
          <Text style={styles.timeValue}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      {item.clockInLocation && (
        <Text style={styles.locationText}>
          📍 {item.clockInLocation.latitude?.toFixed(4)}, {item.clockInLocation.longitude?.toFixed(4)}
        </Text>
      )}
    </View>
  );

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
        <Text style={styles.title}>Time History</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No time entries yet</Text>
          <Text style={styles.emptySubtext}>Your clock in/out history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  listContent: { padding: 16 },
  entryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryDate: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  entryStatus: { fontSize: 12, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusComplete: { backgroundColor: '#dcfce7', color: '#166534' },
  statusActive: { backgroundColor: '#fef3c7', color: '#92400e' },
  entryTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  timeBlock: { alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  timeValue: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  locationText: { fontSize: 12, color: '#9ca3af', marginTop: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
});
