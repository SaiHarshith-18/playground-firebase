import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalloutModal } from '../../contexts/callOutModalContext';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { EventCard } from './EventCard';
import { parseEventDateTime } from '../../utils/Date';
import { openMap } from '../../utils/Location';

export default function CalloutModal() {
  const { isCalloutOpen, closeCallout } = useCalloutModal();
  const navigation = useNavigation();
  const [challengeEvents, setChallengeEvents] = useState([]);

  useEffect(() => {
    if (isCalloutOpen) {
      fetchChallengeEvents();
    }
  }, [isCalloutOpen]);

  const fetchChallengeEvents = async () => {
    try {
      const q = query(collection(db, 'events'), where('isChallenging', '==', true));
      const snapshot = await getDocs(q);
      const now = new Date();

      const result = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(event => {
          const eventDate = parseEventDateTime(event.date, event.time);
          return eventDate >= now;
        })
        .sort((a, b) => {
          const aDate = parseEventDateTime(a.date, a.time);
          const bDate = parseEventDateTime(b.date, b.time);
          return aDate - bDate;
        })
        .slice(0, 3);

      setChallengeEvents(result);
    } catch (error) {
      console.error('Failed to fetch challenge events:', error);
    }
  };

  const handleChallengeCreate = () => {
    closeCallout();
    navigation.navigate('SelectUser', { isChallenge: true });
  };

  return (
    <Modal visible={isCalloutOpen} animationType="slide" transparent onRequestClose={closeCallout}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.downArrowContainer} onPress={closeCallout}>
            <Ionicons name="chevron-down" size={36} color="white" />
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Challenge Events</Text>
            <TouchableOpacity
              onPress={() => {
                closeCallout();
                navigation.navigate('AllUserEvents', { filter: 'challenges' });
              }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 16 }}>
            {challengeEvents.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>
                No challenge events found.
              </Text>
            ) : (
              challengeEvents.slice(0, 3).map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  userId={null}
                  onLocationPress={openMap}
                  onViewDetails={selectedEvent => {
                    closeCallout();
                    navigation.navigate('EventDetails', {
                      event: selectedEvent,
                    });
                  }}
                />
              ))
            )}
          </View>
          <TouchableOpacity style={styles.challengeButton} onPress={handleChallengeCreate}>
            <Text style={styles.buttonText}>Challenge Someone</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonText: {
    color: '#FF822B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
    padding: 14,
  },
  downArrowContainer: {
    alignSelf: 'center',
    position: 'absolute',
    top: 10,
    zIndex: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  eventDetail: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalContent: {
    backgroundColor: '#FF822B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  seeAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    top: -5,
  },
});
