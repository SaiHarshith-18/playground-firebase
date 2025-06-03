// App.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import AllMediaScreen from '../screens/AllMediaScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import LocationPicker from '../screens/LocationPicker';


const Stack = createNativeStackNavigator();

export default function AppNav() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user
          ? (
            <>
              <Stack.Screen name="MainApp" component={BottomTabNavigator} />
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
              <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="AllMedia" component={AllMediaScreen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="LocationPicker" component={LocationPicker} />
            </>
          )
          : (
            <>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
              />
              <Stack.Screen
                name="Register"
                component={RegisterScreen}
              />
            </>
          )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
