import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Menu, Provider } from 'react-native-paper';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, deleteDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import UserAvatar from '../../utils/UserAvatar';

export default function EventDetails({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const initialEvent = route.params.event;
  const [event, setEvent] = useState(initialEvent);
  const isCreator = event.createdBy === user.uid;
  const [menuVisible, setMenuVisible] = useState(false);
  const [joining, setJoining] = useState(false);
  const [attendeeUsers, setAttendeeUsers] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchEvent = async () => {
        const snap = await getDoc(doc(db, 'events', event.id));
        if (snap.exists()) setEvent({ id: event.id, ...snap.data() });
      };
      fetchEvent();
    }, [event.id])
  );

  useEffect(() => {
    const fetchAttendees = async () => {
      const allIds = [...(event.attendees || []), ...(event.invitedUsers || [])];

      // Filter out null/empty/invalid UIDs
      const uniqueIds = Array.from(new Set(allIds)).filter(
        uid => typeof uid === 'string' && uid.trim() !== ''
      );

      if (uniqueIds.length === 0) {
        setAttendeeUsers([]);
        return;
      }

      try {
        const users = [];
        for (const uid of uniqueIds) {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            users.push({ uid, ...userSnap.data() });
          }
        }
        setAttendeeUsers(users);
      } catch (e) {
        console.error('Failed to fetch attendees/invited users', e);
        setAttendeeUsers([]);
      }
    };

    fetchAttendees();
  }, [event.attendees, event.invitedUsers]);

  useEffect(() => {
    if (route.params?.event) {
      setEvent(route.params.event);
    }
  }, [route.params?.event]);

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate('CreateEvent', { event, isEdit: true });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          (async () => {
            try {
              await deleteDoc(doc(db, 'events', event.id));
              if (route.params?.onDelete) route.params.onDelete();
              Alert.alert('Deleted', 'Event deleted');
              navigation.reset('AllUserEvents');
              navigation.reset('AllUserEvents');
            } catch (e) {
              Alert.alert('Error', 'Failed to delete event.');
              console.error('Delete event error:', e);
            }
          })();
        },
      },
    ]);
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        attendees: arrayUnion(user.uid),
      });
      // Refresh event data
      const snap = await getDoc(eventRef);
      if (snap.exists()) setEvent({ id: event.id, ...snap.data() });
      Alert.alert('Joined event!');
    } catch (e) {
      Alert.alert('Error', 'Could not join event.');
    } finally {
      setJoining(false);
    }
  };

  const alreadyJoined = (event.attendees || []).includes(user.uid);

  return (
    <Provider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>{event.title}</Text>
            {isCreator && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setMenuVisible(true)}>
                    <Feather name="more-vertical" size={26} color="#333" />
                  </TouchableOpacity>
                }
              >
                <Menu.Item onPress={handleEdit} title="Edit" />
                <Menu.Item onPress={handleDelete} title="Delete" />
              </Menu>
            )}
          </View>
          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>
            {event.date} at {event.time}
          </Text>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{event.location?.name || 'N/A'}</Text>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{event.description || 'No description provided.'}</Text>

          {/* Join Button only if not creator and not already joined */}
          {!isCreator && !alreadyJoined && !event.isChallenging && (
            <TouchableOpacity onPress={handleJoin} style={styles.joinBtn} disabled={joining}>
              <Text style={styles.joinText}>{joining ? 'Joining...' : 'Join Event'}</Text>
            </TouchableOpacity>
          )}

          {/* Attendees */}
          <Text style={styles.label}>Attendees</Text>
          <View style={styles.attendeeList}>
            {attendeeUsers.length === 0 ? (
              <Text style={styles.value}>No attendees yet.</Text>
            ) : (
              attendeeUsers.map(user => (
                <View key={user.uid} style={styles.attendeeCard}>
                  <UserAvatar avatar={user.avatar} size={60} style={styles.attendeeAvatar} />
                  <Text style={styles.attendeeName}>{user.fullName || 'User'}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  attendeeAvatar: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#FF822B',
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
    width: 60,
  },
  attendeeCard: {
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 12,
    width: 90,
  },
  attendeeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  attendeeName: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  container: { padding: 20 },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6,
    padding: 8,
  },
  joinBtn: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FF822B',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 12,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  joinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: { color: '#444', fontSize: 16, fontWeight: '600', marginTop: 16 },
  safeArea: { backgroundColor: '#fff', flex: 1 },
  saveBtn: {
    backgroundColor: '#FF822B',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    color: '#FF822B',
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingLeft: 0,
    textAlign: 'center',
  },
  value: { color: '#333', fontSize: 15, marginTop: 4 },
});
