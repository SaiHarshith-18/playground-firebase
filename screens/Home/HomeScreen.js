
import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Animated,
  Easing,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import RedPin from '../../assets/location_pin.png';
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// ICON SIZE CONSTANTS
const PROFILE_ICON_SIZE = 75;
const PLUS_ICON_SIZE = PROFILE_ICON_SIZE * 0.5;

export default function HomeScreen() {
  const mapRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  const currentEvent = events[currentEventIndex];

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        setPopupVisible(true);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().avatar) {
            setProfileImage(userSnap.data().avatar);
          } else {
            setProfileImage(null);
          }
        }
        setLoading(false);
      };
      fetchData();
    }, [user])
  );

  useEffect(() => {
    if (!mapRef.current || !currentEvent?.location) return;

    mapRef.current.animateToRegion(
      {
        latitude: currentEvent.location.latitude,
        longitude: currentEvent.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000
    );
  }, [currentEvent]);

  useEffect(() => {
    const fetchEvents = async () => {
      const snapshot = await getDocs(collection(db, 'events'));
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!events.length || !location) return;
    const interval = setInterval(() => {
      setPopupVisible(false);
      setTimeout(() => {
        setCurrentEventIndex(prev => (prev + 1) % events.length);
        setPopupVisible(true);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start();
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [events, location]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No location available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        {events.map((event, idx) => (
          <Marker key={event.id} coordinate={event.location} tracksViewChanges={false}>
            <View style={idx === currentEventIndex ? styles.bigMarker : styles.smallMarker}>
              <Image
                source={RedPin}
                style={{
                  width: currentEventIndex ? (idx === currentEventIndex ? 70 : 20) : 40,
                  height: currentEventIndex ? (idx === currentEventIndex ? 70 : 20) : 40,
                  resizeMode: 'contain',
                }}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {popupVisible && currentEvent && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 250,
            left: 0,
            right: 0,
            alignItems: 'center',
            opacity: fadeAnim,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('EventDetails', { event: currentEvent })}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 10,
              width: 240,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 3 },
              elevation: 5,
            }}
          >
            <Text
              style={{ fontWeight: 'bold', color: '#FF822B', fontSize: 17, textAlign: 'center' }}
            >
              {currentEvent.title}
            </Text>
            <Text style={{ fontSize: 13, color: '#444', textAlign: 'center' }}>
              {currentEvent.location?.name || 'Near you'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.topRightContainer}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle-outline" size={PROFILE_ICON_SIZE} color="grey" />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Feather name="plus" size={PLUS_ICON_SIZE} color="orange" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 40,
    padding: 2,
  },
  smallMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,200,200,0.10)',
    borderRadius: 16,
    padding: 1,
  },
  profileContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  profileImageContainer: {
    backgroundColor: 'white',
    borderRadius: PROFILE_ICON_SIZE,
    padding: 2,
  },
  profileImage: {
    width: PROFILE_ICON_SIZE,
    height: PROFILE_ICON_SIZE,
    borderRadius: PROFILE_ICON_SIZE / 2,
  },
  plusButton: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: PLUS_ICON_SIZE / 2 + 6,
    borderColor: 'grey',
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightContainer: {
    position: 'absolute',
    top: 60,
    right: 30,
    flexDirection: 'column',
    alignItems: 'center',
  },
});
