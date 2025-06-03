import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MessageScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Fetch all users and friends once
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const allUsers = snapshot.docs
        .filter(doc => doc.id !== user.uid)
        .map(doc => ({ uid: doc.id, ...doc.data() }));

      // Get current user's friends
      const currentUserDoc = snapshot.docs.find(doc => doc.id === user.uid);
      const friends = currentUserDoc?.data()?.friends || [];

      setConnectedUsers(allUsers.filter(u => friends.includes(u.uid)));
      setSuggestedUsers(allUsers.filter(u => !friends.includes(u.uid)));
    };
    fetchUsers();
  }, [user]);

  // Live search by fullName
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const fetchSearchResults = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const results = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return (
            doc.id !== user.uid &&
            data.fullName &&
            data.fullName.toLowerCase().includes(search.toLowerCase())
          );
        })
        .map(doc => ({ uid: doc.id, ...doc.data() }));
      setSearchResults(results);
    };
    fetchSearchResults();
  }, [search, user.uid]);

  const handleConnect = async (targetUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const targetRef = doc(db, 'users', targetUser.uid);

      await updateDoc(userRef, { friends: arrayUnion(targetUser.uid) });
      await updateDoc(targetRef, { friends: arrayUnion(user.uid) });

      setConnectedUsers(prev => [...prev, targetUser]);
      setSuggestedUsers(prev => prev.filter(u => u.uid !== targetUser.uid));
      setSearchResults([]);
      setSearch('');
    } catch (err) {
      console.error('Error connecting:', err);
    }
  };

  const navigateToChat = (friend) => {
    navigation.navigate('Chat', { recipient: friend });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.title}>Messages</Text>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name..."
          placeholderTextColor="#888"
        />

        {/* Show search results if searching */}
        {search.trim() ? (
          <>
            <Text style={styles.subHeading}>Search Results</Text>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.uid}
                renderItem={({ item }) => {
                  const isConnected = connectedUsers.some(u => u.uid === item.uid);
                  return (
                    <View style={styles.userCard}>
                      <Text style={styles.userName}>{item.fullName}</Text>
                      {isConnected ? (
                        <TouchableOpacity
                          style={styles.messageBtn}
                          onPress={() => navigateToChat(item)}
                        >
                          <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
                          <Text style={styles.connectBtnText}>Chat</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.connectBtn}
                          onPress={() => handleConnect(item)}
                        >
                          <Ionicons name="person-add" size={18} color="#fff" />
                          <Text style={styles.connectBtnText}>Connect</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
              />
            ) : (
              <Text style={{ marginBottom: 20, color: '#888' }}>No user found</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.subHeading}>Your Friends</Text>
            {connectedUsers.length > 0 ? (
              <FlatList
                data={connectedUsers}
                keyExtractor={item => item.uid}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <TouchableOpacity
                      style={styles.messageBtn}
                      onPress={() => navigateToChat(item)}
                    >
                      <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
                      <Text style={styles.connectBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text style={{ marginBottom: 20 }}>You haven't connected with anyone yet.</Text>
            )}

            <Text style={styles.subHeading}>Suggestions for You</Text>
            {suggestedUsers.length > 0 ? (
              <FlatList
                data={suggestedUsers}
                keyExtractor={item => item.uid}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <TouchableOpacity
                      style={styles.connectBtn}
                      onPress={() => handleConnect(item)}
                    >
                      <Ionicons name="person-add" size={18} color="#fff" />
                      <Text style={styles.connectBtnText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text>No more suggestions, you're all caught up!</Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subHeading: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: { fontSize: 16 },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF822B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  connectBtnText: { color: '#fff', marginLeft: 6 },
  messageBtn: {
    backgroundColor: 'grey',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
});