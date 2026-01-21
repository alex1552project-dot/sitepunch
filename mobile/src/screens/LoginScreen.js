/**
 * Login Screen - SitePunch
 * Company code, Employee ID, and PIN login
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
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Import logo
const logo = require('../assets/sitepunch-logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const [companyCode, setCompanyCode] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!companyCode.trim() || !employeeId.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.login(companyCode.trim(), employeeId.trim(), pin);

      if (result.success) {
        login(result.token, result.employee);
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>SitePunch</Text>
          <Text style={styles.tagline}>Time Tracking Made Simple</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Code</Text>
            <TextInput
              style={styles.input}
              value={companyCode}
              onChangeText={setCompanyCode}
              placeholder="Enter company code"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employee ID</Text>
            <TextInput
              style={styles.input}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="Enter your employee ID"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              placeholder="4-digit PIN"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>

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

        <Text style={styles.footer}>© 2026 SitePunch</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#94a3b8',
  },
  formContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f1419',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#f1f5f9',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 32,
    fontSize: 14,
  },
});
