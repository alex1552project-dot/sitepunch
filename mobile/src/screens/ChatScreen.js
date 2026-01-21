/**
 * Chat Screen
 * Company announcements and messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ChatScreen() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel._id);
    }
  }, [selectedChannel]);

  const loadChannels = async () => {
    try {
      const result = await api.getChannels();
      if (result.success && result.data.length > 0) {
        setChannels(result.data);
        setSelectedChannel(result.data[0]); // Select first channel by default
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const result = await api.getMessages(channelId);
      if (result.success) {
        setMessages(result.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    setIsSending(true);
    try {
      const result = await api.sendMessage(selectedChannel._id, newMessage.trim());
      if (result.success) {
        setNewMessage('');
        loadMessages(selectedChannel._id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === user?._id;

    return (
      <View style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          {!isOwn && <Text style={styles.senderName}>{item.senderName || 'Unknown'}</Text>}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{item.content}</Text>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {selectedChannel && <Text style={styles.channelName}>#{selectedChannel.name}</Text>}
      </View>

      {/* Channel Tabs */}
      {channels.length > 1 && (
        <View style={styles.channelTabs}>
          {channels.map((channel) => (
            <TouchableOpacity
              key={channel._id}
              style={[styles.channelTab, selectedChannel?._id === channel._id && styles.channelTabActive]}
              onPress={() => setSelectedChannel(channel)}
            >
              <Text style={[styles.channelTabText, selectedChannel?._id === channel._id && styles.channelTabTextActive]}>
                {channel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!newMessage.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#2563eb', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  channelName: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  channelTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  channelTab: { flex: 1, padding: 12, alignItems: 'center' },
  channelTabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  channelTabText: { color: '#6b7280', fontWeight: '500' },
  channelTabTextActive: { color: '#2563eb' },
  messagesList: { padding: 16 },
  messageContainer: { marginBottom: 12, alignItems: 'flex-start' },
  messageContainerOwn: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  messageBubbleOwn: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  senderName: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  messageText: { fontSize: 16, color: '#1f2937' },
  messageTextOwn: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#9ca3af', marginTop: 4, alignSelf: 'flex-end' },
  messageTimeOwn: { color: '#bfdbfe' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, color: '#1f2937' },
  sendBtn: { backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginLeft: 8 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});
