import React from 'react';
import AppStack from './navigation/AppStack';
import { AuthProvider } from './contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppStack />
      </AuthProvider>
    </PaperProvider>
  );
}