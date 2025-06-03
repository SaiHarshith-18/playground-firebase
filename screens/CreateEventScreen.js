import React, { useState, useContext, useEffect, use } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CreateEventScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(null); // expecting object { latitude, longitude, name }
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (route?.params?.selectedLocation) {
      setLocation(route.params.selectedLocation);
    }
  }, [route?.params?.selectedLocation]);

  const handleCreateEvent = async () => {
    if (!title || !location || !description) {
      Alert.alert('Validation', 'Please fill in all required fields');
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
      navigation.goBack();
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const openLocationPicker = () => {
    navigation.navigate('LocationPicker');
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
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
        <TextInput
          placeholder="Time (e.g. 6:30 PM)"
          value={time}
          onChangeText={setTime}
          style={styles.input}
        />
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
