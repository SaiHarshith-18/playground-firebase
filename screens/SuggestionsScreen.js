// SuggestionsSection.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function SuggestionsSection() {
  const [tab, setTab] = useState('Friends');
  const [users, setUsers] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const currentUser = allUsers.find(u => u.id === user?.uid);
        const rest = allUsers.filter(u => u.id !== user?.uid);
        setLinkedUsers(currentUser?.friends || []);
        setUsers(rest);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [user]);

  const handleAddFriend = async (friendId) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        friends: arrayUnion(friendId),
      });
      setLinkedUsers(prev => [...prev, friendId]);
    } catch (err) {
      console.error('Error linking user:', err);
    }
  };

  const renderFriend = ({ item }) => {
    const isLinked = linkedUsers.includes(item.id);
    return (
      <View style={styles.friendCard}>
        <Image source={{ uri: item.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} style={styles.friendAvatar} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.fullName || 'Unnamed'}</Text>
          <Text style={styles.friendAbout}>{item.about || 'No bio available'}</Text>
        </View>
        {isLinked ? (
          <TouchableOpacity
            style={[styles.friendAddButton, { backgroundColor: '#ccc' }]}
            onPress={() => navigation.navigate('Chat', { recipient: item })}>
            <Text style={styles.addButtonText}>Message</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.friendAddButton} onPress={() => handleAddFriend(item.id)}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Suggestions</Text>

        {/* Tabs */}
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
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderFriend}
            scrollEnabled={true}
            contentContainerStyle={{ gap: 12 }}
          />
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
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  friendAbout: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  friendAddButton: {
    backgroundColor: '#FF822B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
