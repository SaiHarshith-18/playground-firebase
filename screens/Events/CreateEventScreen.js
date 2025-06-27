import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Menu } from 'react-native-paper';

export default function CreateEventScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const editingEvent = route?.params?.event;
  const isEdit = route?.params?.isEdit;

  const [title, setTitle] = useState('');
  const [gameType, setGameType] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [pickerMode, setPickerMode] = useState(null); // 'date' or 'time'
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [gameTypeMenuVisible, setGameTypeMenuVisible] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([]);

  useEffect(() => {
    if (route?.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [route?.params?.selectedLocation]);

  useEffect(() => {
    if(route?.params?.inviteUserIds){
      setInvitedUsers(route.params.inviteUserIds);
    }
  },[route?.params?.inviteUserIds]);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setLocation(editingEvent.location || null);
      setDescription(editingEvent.description || '');
      setDate(editingEvent.date || '');
      setTime(editingEvent.time || '');
      setGameType(editingEvent.gameType || '');
      setRole(editingEvent.role || '');
    }
  }, [editingEvent]);

  const gameTypeOptions = [
    "Football", "BasketBall", "Baseball", "Ice Hockey", "Soccer",
    "Tennis", "Golf", "Auto Racing", "Wresting", "Lacrosse", "Other"
  ];

 const openLocationPicker = () => {
    navigation.navigate('LocationPicker', {
      onLocationSelected: (location) => {
        setLocation(location);
      },
    },);
};

  const showPicker = (mode) => {
    setPickerMode(mode);
    setPickerVisible(true);
  };

  const hidePicker = () => {
    setPickerVisible(false);
  };

  const handleConfirm = (selected) => {
    if (pickerMode === 'date') {
      const formatted = selected.toLocaleDateString('en-GB').split('/').reverse().join('-');
      setDate(formatted);
    } else if (pickerMode === 'time') {
      const hours = selected.getHours();
      const minutes = selected.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      const formatted = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      setTime(formatted);
    }
    hidePicker();
  };


  const handleSubmit = async () => {
    if (!title || !location || !description || !date || !time) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }
    try {
      if (isEdit && editingEvent?.id) {
        await updateDoc(doc(db, 'events', editingEvent.id), {
          title, location, description, date, time, gameType, role,
        });
        // Fetch the updated event from Firestore
        const updatedSnap = await getDoc(doc(db, 'events', editingEvent.id));
        const updatedEvent = { id: editingEvent.id, ...updatedSnap.data() };
        Alert.alert('Success', 'Event updated!');
      } else {
        await addDoc(collection(db, 'events'), {
          title,
          location,
          description,
          date,
          time,
          gameType,
          role,
          createdBy: user.uid,
          attendees: [user.uid],
          invitedUsers,
          createdAt: serverTimestamp(),
          isChallenging: route?.params?.isChallenge || false
        });
        Alert.alert('Success', 'Event Created!');
      }
      navigation.navigate('AllUserEvents');
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TextInput
          placeholder="Event Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <Menu
          visible={gameTypeMenuVisible}
          onDismiss={() => setGameTypeMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setGameTypeMenuVisible(true)}
            >
              <Text style={{ color: gameType ? '#111' : '#aaa' }}>
                {gameType || 'Select Game Type'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>
          }
          contentStyle={{ backgroundColor: '#fff' }}
        >
          {gameTypeOptions.map(option => (
            <Menu.Item
              key={option}
              onPress={() => {
                setGameType(option);
                setGameTypeMenuVisible(false);
              }}
              title={option}
            />
          ))}
        </Menu>
        <TextInput
          placeholder="Role"
          value={role}
          onChangeText={setRole}
          style={styles.input}
        />
        <TouchableOpacity onPress={openLocationPicker} style={styles.locationInput}>
          <Ionicons name="location-outline" size={20} color="#FF822B" />
          <Text style={styles.locationText}>
            {location ? location.name : 'Choose Location'}
          </Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => showPicker('date')} style={styles.input}>
          <Text>{date ? date : 'Select Date (DD-MM-YYYY)'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => showPicker('time')} style={styles.input}>
          <Text>{time ? time : 'Select Time (e.g. 6:30 PM)'}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isPickerVisible}
          mode={pickerMode}
          date={new Date()}
          onConfirm={handleConfirm}
          onCancel={hidePicker}
          display="spinner"
          themeVariant="light"
          textColor="#000"
        />

        <Button title={isEdit ? "Update Event" : "Create Event"} onPress={handleSubmit} />
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
    padding: 16,
    flex: 1,
  },
  input: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 10,
    color: '#333',
  },
});
