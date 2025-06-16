import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Linking,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Menu, Provider as PaperProvider, List } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from './EventCard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { doc, deleteDoc } from 'firebase/firestore';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const parseEventDateTime = (dateStr, timeStr) => {
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
};

export default function UserEventList() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState('dateAsc');
  const [filters, setFilters] = useState({
    distance: null,
    gameType: null,
    timeRange: null,
    role: 'all',
    status: 'upcoming',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    if (filters.distance) fetchLocationAndFilter();
  }, [filters.distance]);

  const handleEditEvent = (event) => {
    navigation.navigate('CreateEvent', { event, isEdit: true });
  };

  const handleDeleteEvent = async (event) => {
    await deleteDoc(doc(db, 'events', event.id));
    // Optionally refresh the list here
  };

  const openMap = (location) => {
    const lat = location.latitude;
    const lng = location.longitude;
    const label = location.name;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortEvents = (data) => {
    return [...data].sort((a, b) => {
      const dtA = parseEventDateTime(a.date, a.time);
      const dtB = parseEventDateTime(b.date, b.time);
      switch (sortBy) {
        case 'dateAsc': return dtA - dtB;
        case 'dateDesc': return dtB - dtA;
        case 'gameType': return a.gametype?.localeCompare(b.gametype);
        case 'location': return a.location.name.localeCompare(b.location.name);
        case 'timeOfDay': return dtA.getHours() - dtB.getHours();
        default: return dtA - dtB;
      }
    });
  };

  const handleSortChange = (type) => {
    setSortBy(prev => prev === type ? 'dateAsc' : type);
    setSortMenuVisible(false);
  };

  const filterEvents = (data) => {
    const now = new Date();
    return data.filter(event => {
      const dt = parseEventDateTime(event.date, event.time);
      const distance = userLocation ? getDistance(userLocation.latitude, userLocation.longitude, event.location.latitude, event.location.longitude) : null;
      if (searchQuery && !(
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.name.toLowerCase().includes(searchQuery.toLowerCase())
      )) return false;
      if (filters.distance && distance !== null && distance > filters.distance) return false;
      if (filters.gameType && event.gametype?.toLowerCase() !== filters.gameType.toLowerCase()) return false;
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dtStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const dayDiff = Math.floor((dtStart - startOfToday) / (1000 * 60 * 60 * 24));
      if (filters.timeRange === 'today' && dt.toDateString() !== now.toDateString()) return false;
      if (filters.timeRange === 'week' && (dayDiff < 0 || dayDiff > 7)) return false;
      if (filters.timeRange === 'month' && (dt.getMonth() !== now.getMonth() || dt.getFullYear() !== now.getFullYear())) return false;
      if (filters.status === 'upcoming' && dt < now) return false;
      if (filters.status === 'past' && dt >= now) return false;
      if (filters.role === 'creator' && event.createdBy !== user.uid) return false;
      if (filters.role === 'attendee' && !(event.attendees || []).includes(user.uid)) return false;
      return true;
    });
  };

  const applyFiltersAndSort = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let result = filterEvents(events);
    result = sortEvents(result);
    setFilteredEvents(result);
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, 'events'));
      const snapshot = await getDocs(q);
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationAndFilter = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchLocationAndFilter();
    }, [])
  );
  useEffect(() => { if (events.length > 0) applyFiltersAndSort(); }, [events, filters, sortBy, searchQuery]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <PaperProvider>
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.wrapper}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
          >
            <Ionicons name="arrow-back" size={24} color="#FF822B" />
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
          <View style={styles.iconBar}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FF822B' }}>Events</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setSortMenuVisible(true)}>
              <Ionicons name="swap-vertical" size={24} color="#FF822B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterMenuVisible(true)}>
              <MaterialCommunityIcons name="filter-variant" size={24} color="#FF822B" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchBar}
            placeholder="Search by title, description, or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={{ x: 30, y: 70 }}
            contentStyle={{ backgroundColor: '#FFE5D1' }}
          >
            {[
              { key: 'dateAsc', label: 'Date Ascending' },
              { key: 'dateDesc', label: 'Date Descending' },
              { key: 'gameType', label: 'Game Type' },
              { key: 'location', label: 'Location' },
              { key: 'timeOfDay', label: 'Time of Day' },
            ].map(({ key, label }) => (
              <Menu.Item
                key={key}
                onPress={() => {
                  setSortBy(prev => (prev === key ? 'dateAsc' : key));
                  setSortMenuVisible(false);
                }}
                title={label}
                style={sortBy === key ? { backgroundColor: '#FF822B' } : null}
                titleStyle={sortBy === key ? { color: '#fff', fontWeight: 'bold' } : { fontWeight: 'normal' }}
                right={() =>
                  sortBy === key ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : null
                }
              />
            ))}
          </Menu>

          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={{ x: 100, y: 70 }}
            contentStyle={{ backgroundColor: '#FFE5D1' }}
          >
            {/* Distance Filters */}
            <List.Item
              onPress={() => {
                const newDistance = filters.distance === 2 ? null : 2;
                setFilters(prev => ({ ...prev, distance: newDistance }));
                setFilterMenuVisible(false);
              }}
              title="Within 2 miles"
              style={filters.distance === 2 ? { backgroundColor: '#FF822B' } : null}
              titleStyle={filters.distance === 2 ? { color: '#fff', fontWeight: 'bold' } : null}
            />
            <List.Item
              onPress={() => {
                const newDistance = filters.distance === 5 ? null : 5;
                setFilters(prev => ({ ...prev, distance: newDistance }));
                setFilterMenuVisible(false);
              }}
              title="Within 5 miles"
              style={filters.distance === 5 ? { backgroundColor: '#FF822B' } : null}
              titleStyle={filters.distance === 5 ? { color: '#FFF', fontWeight: 'bold' } : null}
            />

            {/* Time Range Filters */}
            {['today', 'week', 'month'].map(range => (
              <List.Item
                key={range}
                onPress={() => {
                  const newTime = filters.timeRange === range ? null : range;
                  setFilters(prev => ({ ...prev, timeRange: newTime }));
                  setFilterMenuVisible(false);
                }}
                title={range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                style={filters.timeRange === range ? { backgroundColor: '#FF822B' } : null}
                titleStyle={filters.timeRange === range ? { color: '#FFF', fontWeight: 'bold' } : null}
              />
            ))}

            {/* Role Filter */}
            {['creator', 'attendee'].map(role => (
              <List.Item
                key={role}
                onPress={() => {
                  const newRole = filters.role === role ? 'all' : role;
                  setFilters(prev => ({ ...prev, role: newRole }));
                  setFilterMenuVisible(false);
                }}
                title={role === 'creator' ? 'My Created Events' : "Events I'm Attending"}
                style={filters.role === role ? { backgroundColor: '#FF822B' } : null}
                titleStyle={filters.role === role ? { color: '#FFF', fontWeight: 'bold' } : null}
              />
            ))}

            {/* Status Filter */}
            {['upcoming', 'past'].map(status => (
              <List.Item
                key={status}
                onPress={() => {
                  const newStatus = filters.status === status ? null : status;
                  setFilters(prev => ({ ...prev, status: newStatus }));
                  setFilterMenuVisible(false);
                }}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
                style={filters.status === status ? { backgroundColor: '#FF822B' } : null}
                titleStyle={filters.status === status ? { color: '#FFF', fontWeight: 'bold' } : null}
              />
            ))}
            <List.Item
              onPress={() => {
                setFilters({
                  distance: null,
                  gameType: null,
                  timeRange: null,
                  role: 'all',
                  status: 'upcoming',
                });
                setFilterMenuVisible(false);
                setTimeout(applyFiltersAndSort, 0);
              }}
              title="Clear All Filters"
              right={() => <Ionicons name="close-circle" size={18} color="#FF822B" />}
            />
          </Menu>


          <ScrollView style={styles.container}>
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                userId={user.uid}
                onLocationPress={openMap}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onViewDetails={(selectedEvent) => navigation.navigate('EventDetails', { event: selectedEvent, userId: user.uid })}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    flex: 1,
    paddingHorizontal: 0,
  },
  container: { padding: 16, backgroundColor: '#fff' },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    margin: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
    marginRight: 16,
    marginLeft: 16,
  },
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
