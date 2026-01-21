/**
 * Auth Context
 * Manages authentication state across the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'sitepunch_token';
const USER_KEY = 'sitepunch_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        const userData = JSON.parse(userJson);
        api.setToken(token);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (companyCode, pin, employeeId) => {
    try {
      const result = await api.login(companyCode, pin, employeeId);

      if (result.success) {
        const { token, employee } = result.data;

        // Store credentials
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(employee));

        api.setToken(token);
        setUser(employee);

        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      api.setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
