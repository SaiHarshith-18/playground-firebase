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
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CreateEventScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (route?.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [route?.params?.selectedLocation]);

  const handleCreateEvent = async () => {
    if (!title || !location || !description || !date || !time) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }

    const enrichedLocation = {
      ...location,
      name: location.name || `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
    };

    try {
      await addDoc(collection(db, 'events'), {
        title,
        location: enrichedLocation,
        description,
        date,
        time,
        createdBy: user.uid,
        attendees: [user.uid],
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Event Created!');
      navigation.navigate('MainApp', { screen: 'Profile' });
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const openLocationPicker = () => {
    navigation.navigate('LocationPicker');
  };

  const handleDateChange = (event, newDate) => {
    if (Platform.OS === 'ios') {
      setSelectedDate(newDate || selectedDate); // keep selectedDate until user confirms
    } else {
      setShowDatePicker(false);
      if (newDate) {
        const formatted = newDate.toLocaleDateString('en-GB').split('/').reverse().join('-');
        setDate(formatted);
      }
    }
  };



  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      const formatted = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      setTime(formatted);
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
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text>{date ? date : 'Select Date (DD-MM-YYYY)'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
          <Text>{time ? time : 'Select Time (e.g. 6:30 PM)'}</Text>
        </TouchableOpacity>

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, marginTop: 10 }}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
            <Button
              title="Confirm"
              onPress={() => {
                const formatted = selectedDate.toLocaleDateString('en-GB').split('/').reverse().join('-');
                setDate(formatted);
                setShowDatePicker(false);
              }}
            />
          </View>
        )}


        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="spinner"
            is24Hour={false}
            onChange={handleTimeChange}
          />
        )}

        <Button title="Create Event" onPress={handleCreateEvent} />
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
