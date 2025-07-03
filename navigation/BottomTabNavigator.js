import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessageScreen from '../screens/Chat/MessageScreen';
import SettingScreen from '../screens/Notifications/SettingScreen';
import { useCalloutModal } from '../contexts/callOutModalContext';


const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {

  const {openCallout} = useCalloutModal();
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: false,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: Platform.OS === 'ios' ? 10 : 0,
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={30} color={focused ? '#FF822B' : 'gray'} />
              {focused && <View style={styles.bottomLine} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={30} color={focused ? '#FF822B' : 'gray'} />
              {focused && <View style={styles.bottomLine} />}
            </View>
          ),
        }}
      />
      {/* Custom Center Callout Button */}
      <Tab.Screen
        name="Callout"
        component={HomeScreen}
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={openCallout}
              activeOpacity={0.8}
              style={styles.calloutButton}
            >
              <Image
                source={require('../assets/callout.png')}
                style={styles.calloutButton}
              />
            </TouchableOpacity>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={30} color={focused ? 'orange' : 'gray'} />
              {focused && <View style={styles.bottomLine} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons name="settings-outline" size={30} color={focused ? '#FF822B' : 'gray'} />
              {focused && <View style={styles.bottomLine} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  bottomLine: {
    marginTop: 2,
    height: 3,
    width: 24,
    backgroundColor: '#EF6607',
    borderRadius: 2,
  },
  calloutButton: {
    width: 105,
    height: 105,
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    left: -5
  },
});
