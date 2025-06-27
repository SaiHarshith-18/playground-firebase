// SuggestionsSection.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { RenderFriend } from '../../utils/RenderFriend';

export default function SuggestionsSection() {
  const [tab, setTab] = useState('Friends');
  const [users, setUsers] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const currentUser = allUsers.find((u) => u.id === user.uid);
      const rest = allUsers.filter((u) => u.id !== user.uid);
      setLinkedUsers(currentUser?.friends || []);
      setUsers(rest);
    });

    return () => unsubscribeUsers();
  }, [user?.uid]);

  const handleAddFriend = async (friendId) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);
      await updateDoc(userRef, {
        sentRequests: arrayUnion(friendId),
      });
      await updateDoc(friendRef, {
        receivedRequests: arrayUnion(user.uid),
      });
      setUsers(prev =>
        prev.map(u =>
          u.id === friendId
            ? {
              ...u,
              receivedRequests: [...(u.receivedRequests || []), user.uid],
            }
            : u
        )
      );
    } catch (err) {
      console.error('Error sending request:', err);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendId);
      await updateDoc(userRef, {
        friends: arrayUnion(friendId),
        receivedRequests: arrayRemove(friendId),
      });
      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid),
        sentRequests: arrayRemove(user.uid),
      });
      setLinkedUsers((prev) => [...prev, friendId]);
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleMessage = (friend) => {
    navigation.navigate('Chat', { recipient: { ...friend, uid: friend.id } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        <View style={styles.tabs}>
          {['Friends', 'Squad'].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.activeTab]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === 'Squad' ? (
          <View style={styles.emptySquadContainer}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.noSquadText}>No squads found</Text>
            <TouchableOpacity style={styles.createSquadButton}>
              <Text style={styles.createSquadText}>Create your squad</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              <FlatList
                data={users.filter(u => !linkedUsers.includes(u.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RenderFriend
                    item={item}
                    user={user}
                    linkedUsers={linkedUsers}
                    onAddFriend={handleAddFriend}
                    onAcceptRequest={handleAcceptRequest}
                    onMessage={handleMessage}
                  />
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No suggestions found.</Text>}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 12 }}
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Friends</Text>
              <FlatList
                data={users.filter(u => linkedUsers.includes(u.id))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RenderFriend
                    item={item}
                    user={user}
                    linkedUsers={linkedUsers}
                    onAddFriend={handleAddFriend}
                    onAcceptRequest={handleAcceptRequest}
                    onMessage={handleMessage}
                  />
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No friends yet.</Text>}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 12 }}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    marginTop: 16,
    paddingHorizontal: 15,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabText: {
    fontSize: 16,
    color: '#aaa',
  },
  activeTab: {
    color: '#FF822B',
    borderBottomWidth: 2,
    borderColor: '#FF822B',
    paddingBottom: 4,
  },
  emptySquadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  noSquadText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  createSquadButton: {
    backgroundColor: '#FF822B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createSquadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});