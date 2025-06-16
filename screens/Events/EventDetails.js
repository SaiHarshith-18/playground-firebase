import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Menu, Provider } from 'react-native-paper';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, deleteDoc,getDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native'

export default function EventDetails({ route, navigation }) {
  const { user } = useContext(AuthContext);
  const initialEvent = route.params.event;
  const [event, setEvent] = useState(initialEvent);
  const isCreator = event.createdBy === user.uid;

  const [menuVisible, setMenuVisible] = useState(false);

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
  if (route.params?.event) {
    setEvent(route.params.event);
  }
}, [route.params?.event]);

  const handleEdit = () => {
    setMenuVisible(false);
    navigation.navigate('CreateEvent', { event, isEdit: true });
  };

  const handleDelete = async () => {
    setMenuVisible(false);
    Alert.alert('Delete Event', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'events', event.id));
          Alert.alert('Deleted', 'Event deleted');
          navigation.goBack();
        }
      }
    ]);
  };

  return (
  <Provider>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
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
        <Text style={styles.value}>{event.date} at {event.time}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{event.location?.name || 'N/A'}</Text>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{event.description || 'No description provided.'}</Text>
      </View>
    </SafeAreaView>
  </Provider>
  );
}

const styles = StyleSheet.create({
   safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF822B', flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: '#444', marginTop: 16 },
  value: { fontSize: 15, color: '#333', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
  },
  saveBtn: {
    backgroundColor: '#FF822B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
