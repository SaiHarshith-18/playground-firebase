import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Modal,
  Animated,
  Easing,
} from "react-native";
import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { useFocusEffect, useNavigation, useIsFocused } from '@react-navigation/native';
import { useCallback } from 'react';

export default function HomeScreen() {
  const mapRef = useRef(null);
  const isFocused = useIsFocused();
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const navigation = useNavigation();

  const markerPosition = useRef(null);

  useEffect(() => {
    if (location && !markerPosition.current) {
      markerPosition.current = new AnimatedRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

 useEffect(() => {
  if (!mapRef.current || !currentEvent?.location) return;

  const timeout = setTimeout(() => {
    mapRef.current.pointForCoordinate({
      latitude: currentEvent.location.latitude,
      longitude: currentEvent.location.longitude,
    }).then(point => {
      setPopupPosition({ x: point.x, y: point.y });
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }).catch((e) => console.warn('pointForCoordinate error:', e));
  }, 500); // delay slightly to ensure layout is done

  return () => clearTimeout(timeout);
}, [currentEvent, mapRef.current]);


  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        setPopupVisible(true);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
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
        setCurrentEventIndex((prev) => (prev + 1) % events.length);
        setPopupVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start();
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [events, location]);

  useEffect(() => {
    if (!events.length || !mapRef.current || !markerPosition.current) return;
    const event = events[currentEventIndex];
    if (event?.location?.latitude && event?.location?.longitude) {
      mapRef.current.animateToRegion({
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);

      markerPosition.current.timing({
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [currentEventIndex, events]);

  const currentEvent = events[currentEventIndex];

   const pickImage = async () => {
  };

  const handleCreateEvent = async () => {
    try {
      const eventRef = await addDoc(collection(db, 'events'), {
        title,
        location,
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
    }
  };

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

  const initialRegion = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
     <MapView
  ref={mapRef}
  style={styles.map}
  initialRegion={location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined}
  showsUserLocation
>
  {events.map((event, idx) => (
    <Marker
      key={event.id}
      coordinate={event.location}
      // Use a custom marker for the current event
      tracksViewChanges={false}
    >
      {idx === currentEventIndex ? (
        // Big red marker for current event
        <View style={styles.bigMarker}>
          <Ionicons name="location-sharp" size={50} color="#FF3B30" />
        </View>
      ) : (
        // Small gray marker for others
        <View style={styles.smallMarker}>
          <Ionicons name="location-sharp" size={28} color="#888" />
        </View>
      )}
    </Marker>
  ))}
</MapView>

    {popupPosition && (
  <Animated.View
    style={{
      position: 'absolute',
      left: popupPosition.x-80,
      top: popupPosition.y-80,
      width: 200,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
      opacity: fadeAnim,
      zIndex: 999,
    }}
  >
<TouchableOpacity
    onPress={() => navigation.navigate('EventDetails', { event: currentEvent })}
    style={{ alignItems: 'center' }}
  >
    <Text style={{
      fontWeight: 'bold',
      color: '#FF822B',
      fontSize: 17,
      marginBottom: 4,
      textAlign: 'center',
    }}>
      {currentEvent?.title}
    </Text>
    <Text style={{
      fontSize: 13,
      color: '#444',
      textAlign: 'center',
      marginBottom: 2,
    }}>
      {currentEvent?.location?.name || "Near you"}
    </Text>
  </TouchableOpacity>
</Animated.View>
    )}

 {/* Top Right Buttons */}
      <View style={styles.topRightContainer}>
        {/* Profile Icon */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={48} color="grey" />
            )}
          </View>

          {/* Small Camera Button */}
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Ionicons name="camera" size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Plus Icon */}
        <TouchableOpacity style={styles.plusButton} onPress={() => navigation.navigate('CreateEvent')}>
          <Feather name="plus" size={38} color="orange"/>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  popupContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 6,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF822B',
    marginBottom: 8,
    textAlign: 'center',
  },
  bigMarker: {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255,130,43,0.15)',
  borderRadius: 30,
  padding: 2,
},
smallMarker: {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(200,200,200,0.10)',
  borderRadius: 16,
  padding: 1,
},
  popupLocation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  popupButton: {
    backgroundColor: '#FF822B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  popupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  topRightContainer: {
    position: "absolute",
    top: 60,
    right: 30,
    flex: 1,
    flexDirection: "row-reverse",
    gap: 13,
    alignItems: "center",
  },
  topButton: {
    marginBottom: 10,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topButtonImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  plusButton: {
    backgroundColor: "white",
    padding: 6,
    borderRadius: 30,
    borderColor: "grey",
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  calloutButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutImage: {
    width: 70,
    height: 70,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileContainer: {
    position: "relative",
    marginBottom: 20,
    alignItems: "center",
  },
  profileImageContainer: {
    backgroundColor: "white",
    borderRadius: 50,
    padding: 2,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 40,
  },
  cameraButton: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "grey",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
