/**
 * Login Screen
 * Company code + Employee ID + PIN authentication
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [companyCode, setCompanyCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!companyCode.trim()) {
      Alert.alert('Error', 'Please enter your company code');
      return;
    }
    if (!employeeId.trim()) {
      Alert.alert('Error', 'Please enter your employee ID');
      return;
    }
    if (!pin.trim()) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setIsLoading(true);
    const result = await login(companyCode.trim(), pin.trim(), employeeId.trim());
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⏱️</Text>
          <Text style={styles.title}>SitePunch</Text>
          <Text style={styles.subtitle}>Time Tracking Made Simple</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Company Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter company code"
            placeholderTextColor="#9ca3af"
            value={companyCode}
            onChangeText={setCompanyCode}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Employee ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your employee ID"
            placeholderTextColor="#9ca3af"
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your PIN"
            placeholderTextColor="#9ca3af"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Contact your supervisor if you need help logging in.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 8,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    color: '#bfdbfe',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});
