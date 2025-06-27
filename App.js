import React from 'react';
import AppStack from './navigation/AppStack';
import { AuthProvider } from './contexts/AuthContext';
import CalloutModal from './screens/Events/CalloutModal';
import { Provider as PaperProvider } from 'react-native-paper';
import { CalloutModalProvider } from './contexts/callOutModalContext';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigation/RootNavigation';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <CalloutModalProvider>
          <NavigationContainer ref={navigationRef}>
            <AppStack />
             <CalloutModal />
          </NavigationContainer>
         
        </CalloutModalProvider>
      </AuthProvider>
    </PaperProvider>
  );
}