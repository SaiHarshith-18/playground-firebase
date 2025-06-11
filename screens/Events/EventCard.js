import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date('invalid');
  const [year, month, day] = dateStr.trim().split('-');
  const cleanTime = timeStr.trim().toUpperCase();
  const convertTo24Hr = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };
  const isoDate = `${year}-${month}-${day}T${convertTo24Hr(cleanTime)}`;
  return new Date(isoDate);
}

export function EventCard({ event, onLocationPress }) {
  const eventDate = parseEventDateTime(event.date, event.time);
  return (
    <View style={styles.eventCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBlock: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  day: { fontSize: 18, fontWeight: 'bold', color: '#FF822B' },
  month: { fontSize: 12, color: '#888', marginTop: -2 },
  eventContent: { flex: 1 },
  titleTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: { fontWeight: 'bold', fontSize: 16, flex: 1 },
  eventTime: { fontSize: 14, color: '#444', marginLeft: 12 },
  eventLocation: { fontSize: 14, color: '#FF822B', marginVertical: 2, textDecorationLine: 'underline' },
  eventDescription: { fontSize: 13, color: '#666', marginTop: 4 },
});