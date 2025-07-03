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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selected: {
    borderColor: '#FF822B',
    backgroundColor: '#ffe8d9',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  createEventBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#FF822B',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  createEventBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
});
