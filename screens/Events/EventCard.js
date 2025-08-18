import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date('invalid');
  const [year, month, day] = dateStr.trim().split('-');
  const cleanTime = timeStr.trim().toUpperCase();
  const convertTo24Hr = time12h => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };
  const isoDate = `${year}-${month}-${day}T${convertTo24Hr(cleanTime)}`;
  return new Date(isoDate);
}

export function EventCard({ event, onLocationPress, userId, onViewDetails }) {
  const eventDate = parseEventDateTime(event.date, event.time);
  const isCreator = event.createdBy === userId;
  return (
    <Pressable
      onPress={() => onViewDetails(event)}
      android_ripple={{ color: '#eee' }}
      style={styles.eventCard}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.day}>{eventDate.getDate()}</Text>
        <Text style={styles.month}>
          {eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}
        </Text>
      </View>
      <View style={styles.eventContent}>
        <View style={styles.titleTimeRow}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventTime}>{event.time}</Text>
        </View>
        <TouchableOpacity onPress={() => onLocationPress(event.location)}>
          <Text style={styles.eventLocation}>{event.location?.name}</Text>
        </TouchableOpacity>
        <Text style={styles.eventDescription}>{event.description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    width: 48,
  },
  day: {
    color: '#FF822B',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    maxWidth: '100%',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  eventContent: {
    flex: 1,
    flexShrink: 1,
  },
  eventDescription: {
    color: '#666',
    flexWrap: 'wrap',
    fontSize: 13,
    marginTop: 4,
    width: '100%',
  },
  eventLocation: {
    color: '#FF822B',
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 14,
    marginVertical: 2,
    textDecorationLine: 'underline',
    width: '100%',
  },
  eventTime: {
    color: '#444',
    flexShrink: 0,
    fontSize: 14,
    marginLeft: 12,
  },
  eventTitle: {
    flex: 1,
    flexWrap: 'wrap',
    fontSize: 16,
    fontWeight: 'bold',
  },
  month: {
    color: '#888',
    fontSize: 12,
    marginTop: 0,
  },
  titleTimeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});
