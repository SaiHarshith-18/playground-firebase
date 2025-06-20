// SuggestionsSection.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
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
} from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';

export default function SuggestionsSection() {
  const [tab, setTab] = useState('Friends');
  const [users, setUsers] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?.uid) return;

    // Listen for changes to all users
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

      // ✅ Update local UI immediately
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

  const renderFriend = ({ item }) => {
    const currentUserId = user?.uid;
    const isFriend = linkedUsers.includes(item.id);
    const hasSentRequest = item?.receivedRequests?.includes(currentUserId); // Correct!
    const hasReceivedRequest = item?.sentRequests?.includes(currentUserId);

    let actionButton;
    if (isFriend) {
      actionButton = (
        <TouchableOpacity
          style={[styles.friendAddButton, { backgroundColor: '#ccc' }]}
          onPress={() => handleMessage(item)}
        >
          <Text style={styles.addButtonText}>Message</Text>
        </TouchableOpacity>
      );
    } else if (hasSentRequest) {
      actionButton = (
        <View style={[styles.friendAddButton, { backgroundColor: '#999' }]}>
          <Text style={styles.addButtonText}>Request Sent</Text>
        </View>
      );
    } else if (hasReceivedRequest) {
      actionButton = (
        <TouchableOpacity
          style={[styles.friendAddButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.addButtonText}>Accept</Text>
        </TouchableOpacity>
      );
    } else {
      actionButton = (
        <TouchableOpacity
          style={styles.friendAddButton}
          onPress={() => handleAddFriend(item.id)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      );
    }


    return (
      <View style={styles.friendCard}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={styles.friendAvatar}
          />
        ) : (
          <Ionicons name="person-circle-outline" size={50} color="grey" style={styles.friendAvatar} />
        )}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.fullName || 'Unnamed'}</Text>
          <Text style={styles.friendAbout}>{item.about || 'No bio available'}</Text>
        </View>
        {actionButton}
      </View>
    );
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
          <FlatList
            data={users.filter(u => !linkedUsers.includes(u.id))}
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
