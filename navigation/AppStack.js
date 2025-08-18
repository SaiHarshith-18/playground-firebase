// App.js
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/Authentication/LoginScreen';
import RegisterScreen from '../screens/Authentication/RegisterScreen';
import PostDetailScreen from '../screens/Media/PostDetailScreen';
import SuggestionsScreen from '../screens/Chat/SuggestionsScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ChatScreen from '../screens/Chat/ChatScreen';
import AllMediaScreen from '../screens/Media/AllMediaScreen';
import CreateEventScreen from '../screens/Events/CreateEventScreen';
import LocationPicker from '../screens/Events/LocationPicker';
import UserEventList from '../screens/Events/UserEventList';
import EventDetails from '../screens/Events/EventDetails';
import CallOutModal from '../screens/Events/CalloutModal';
import SelectUser from '../screens/Events/SelectUserScreen';

const Stack = createNativeStackNavigator();

export default function AppNav() {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        gestureResponseDistance: { horizontal: 0 },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
          <Stack.Screen name="CalloutModal" component={CallOutModal} />
          <Stack.Screen name="SelectUser" component={SelectUser} />
          <Stack.Screen name="AllUserEvents" component={UserEventList} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen
            name="EventDetails"
            component={EventDetails}
            options={{ title: 'Event Details' }}
          />
          <Stack.Screen name="AllMedia" component={AllMediaScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen
            name="LocationPicker"
            component={LocationPicker}
            options={{
              gestureEnabled: false,
              gestureResponseDistance: { horizontal: 0 },
              headerShown: false,
              animationEnabled: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
