// screens/HomeScreen.js
import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const email = user?.email ?? '';
  // take the part before the “@”
  const username = email.split('@')[0] || 'User';

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {username}!</Text>
      <Button title="Sign Out" onPress={() => signOut(auth)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center' },
  welcome:   { fontSize:20, marginBottom:20 },
});
