import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db,auth } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  const suggestions = [
    { id: '1', name: 'London', image: { uri: 'https://randomuser.me/api/portraits/women/21.jpg' } },
    { id: '2', name: 'Oslo', image: { uri: 'https://randomuser.me/api/portraits/men/32.jpg' } },
    { id: '3', name: 'Bangkok', image: { uri: 'https://randomuser.me/api/portraits/women/44.jpg' } },
    { id: '4', name: 'Minsk', image: { uri: 'https://randomuser.me/api/portraits/men/25.jpg' } },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.uid) return;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setFormData({
            fullName: data.fullName || '',
            about: data.about || '',
          });
        } else {
          setProfileData({});
          setFormData({ fullName: '', about: '' });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...profileData,
        fullName: formData.fullName,
        about: formData.about,
      };

      await setDoc(userRef, updatedProfile, { merge: true });
      setProfileData(updatedProfile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged in AuthContext will handle navigation
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  const fullName = formData.fullName || 'User';
  const avatar = profileData?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';
  const followers = profileData?.followers ?? 0;
  const following = profileData?.following ?? 0;
  const about = formData.about || '';

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        {editMode ? (
          <TextInput
            style={styles.inputName}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          />
        ) : (
          <Text style={styles.name}>Hey {fullName}</Text>
        )}
        <View style={styles.icons}>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            <Ionicons name={editMode ? 'close-outline' : 'create-outline'} size={24} style={styles.icon} />
          </TouchableOpacity>
          {editMode && (
            <TouchableOpacity onPress={handleSave}>
              <Ionicons name="checkmark-done-outline" size={24} style={styles.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.avatars}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/81.jpg' }} style={styles.avatar} />
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        {editMode ? (
          <TextInput
            style={styles.inputAbout}
            value={formData.about}
            multiline
            onChangeText={(text) => setFormData({ ...formData, about: text })}
            placeholder="Write something about yourself..."
          />
        ) : (
          <Text style={styles.aboutText}>{about || 'No bio added yet.'}</Text>
        )}
      </View>

      {/* Media Upload Section */}
      <View style={styles.mediaRow}>
        {[1, 2, 3].map((_, i) => (
          <TouchableOpacity key={i} style={styles.mediaBox}>
            <Ionicons name="add-outline" size={32} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Events Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Events</Text>
        <Text style={styles.eventTitle}>Basketball at the Willows</Text>
        <Text style={styles.eventText}>145 Champions Way Dr. Fairfield, OH 45014</Text>
        <Text style={styles.eventSubText}>Anyone welcome to join. Real hoopers only.</Text>
      </View>

      {/* Suggestions Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        <FlatList
          data={suggestions}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.suggestionBox}>
              <Image source={item.image} style={styles.suggestionAvatar} />
              <Text style={styles.suggestionLabel}>{item.name}</Text>
            </View>
          )}
        />
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: 'bold' },
  icons: { flexDirection: 'row' },
  icon: { marginLeft: 15 },
  inputName: {
    fontSize: 26,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    minWidth: 150,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: '#666' },
  avatars: { flexDirection: 'row' },
  avatar: { width: 30, height: 30, borderRadius: 15, marginHorizontal: 2 },
  card: { padding: 15, backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  aboutText: { fontSize: 14, color: '#333' },
  inputAbout: {
    fontSize: 14,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  mediaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  mediaBox: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTitle: { fontWeight: 'bold', fontSize: 16 },
  eventText: { fontSize: 14, color: '#444' },
  eventSubText: { fontSize: 12, color: '#888' },
  suggestionBox: { alignItems: 'center', marginRight: 15 },
  suggestionAvatar: { width: 50, height: 50, borderRadius: 25 },
  suggestionLabel: { fontSize: 12, marginTop: 4 },
   logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});