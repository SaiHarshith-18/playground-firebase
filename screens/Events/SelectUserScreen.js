import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../../utils/UserAvatar';

export default function SelectUserScreen({ route }) {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user => user?.fullName?.toLowerCase().includes(search?.toLowerCase()))
    );
  }, [search, users]);

  const handleUserPress = user => {
    setSelectedUsers(prev => {
      if (prev.some(u => u.id === user.id)) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.some(u => u.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.userCard, isSelected && styles.selected]}
        onPress={() => handleUserPress(item)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <UserAvatar avatar={item.avatar} style={styles.friendAvatar} size={36} />
          <Text style={styles.userName}>{item.fullName || item.name || 'User'}</Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" style={{ marginLeft: 8 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0) {
      navigation.navigate('CreateEvent', {
        isChallenge: true,
        inviteUserIds: selectedUsers.map(u => u.id),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search users to challenge..."
          style={styles.searchInput}
        />
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </View>
      <TouchableOpacity
        style={[styles.createEventBtn, selectedUsers.length === 0 && styles.disabledBtn]}
        onPress={handleConfirm}
        disabled={selectedUsers.length === 0}
      >
        <Text style={styles.createEventBtnText}>Create Event</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  createEventBtn: {
    alignItems: 'center',
    backgroundColor: '#FF822B',
    borderRadius: 10,
    bottom: 24,
    elevation: 2,
    left: 16,
    paddingVertical: 16,
    position: 'absolute',
    right: 16,
  },
  createEventBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  emptyText: {
    color: '#888',
    marginTop: 30,
    textAlign: 'center',
  },
  safeArea: { backgroundColor: '#fff', flex: 1 },
  searchInput: {
    borderColor: '#ccc',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selected: {
    backgroundColor: '#ffe8d9',
    borderColor: '#FF822B',
  },
  userCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  userName: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
