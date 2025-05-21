// App.js
import React, { useContext } from 'react';
import AppStack from './navigation/AppStack';
import { AuthProvider } from './contexts/AuthContext';


export default function App() {
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}
