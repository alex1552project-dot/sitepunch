/**
 * SitePunch Mobile App
 * Main entry point with navigation
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TimeHistoryScreen from './src/screens/TimeHistoryScreen';
import IncidentReportScreen from './src/screens/IncidentReportScreen';
import ChatScreen from './src/screens/ChatScreen';
import PoliciesScreen from './src/screens/PoliciesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TimeOffScreen from './src/screens/TimeOffScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    'Clock In/Out': '🏠',
    'Time History': '⏱️',
    'Report': '⚠️',
    'Messages': '💬',
    'Policies': '📋',
    'Profile': '👤',
  };
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>{icons[label] || '📱'}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Clock In/Out" component={HomeScreen} />
      <Tab.Screen name="Time History" component={TimeHistoryScreen} />
      <Tab.Screen name="Report" component={IncidentReportScreen} />
      <Tab.Screen name="Messages" component={ChatScreen} />
      <Tab.Screen name="Policies" component={PoliciesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2563eb' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>SitePunch</Text>
        <Text style={{ color: '#bfdbfe', marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="TimeOff" component={TimeOffScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
