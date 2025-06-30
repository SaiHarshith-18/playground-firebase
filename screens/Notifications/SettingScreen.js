import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { AuthContext } from '../../contexts/AuthContext';
import { auth } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <List.Section>
        <List.Subheader style={styles.subheader}>Account</List.Subheader>

        <List.Item
          title="Edit Profile"
          left={() => <Ionicons name="person-circle-outline" size={22} color="#555" />}
          onPress={() => navigation.navigate('Profile')}
        />

        <List.Item
          title="Notifications"
          left={() => <Ionicons name="notifications-outline" size={22} color="#555" />}
          onPress={() => navigation.navigate('Notifications')}
        />

        <Divider />

        <List.Subheader style={styles.subheader}>App</List.Subheader>

        <List.Item
          title="Theme"
          left={() => <Ionicons name="color-palette-outline" size={22} color="#555" />}
          onPress={() => Alert.alert('Theme', 'Theme settings coming soon!')}
        />

        <List.Item
          title="Help & Support"
          left={() => <Ionicons name="help-circle-outline" size={22} color="#555" />}
          onPress={() => Alert.alert('Support', 'Need help? Contact us at\ncampusteam@support.com')}
        />

        <List.Item
          title="About"
          left={() => <MaterialIcons name="info-outline" size={22} color="#555" />}
          onPress={() => Alert.alert('About', 'Campus Connect v1.0\nDeveloped by Your Team')}
        />

        <Divider />

        <List.Item
          title="Log Out"
          titleStyle={{ color: '#FF3B30', fontWeight: 'bold' }}
          left={() => <Ionicons name="log-out-outline" size={22} color="#FF3B30" />}
          onPress={handleLogout}
        />
      </List.Section>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subheader: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#444',
    paddingLeft: 16,
    paddingTop: 10,
  },
});
