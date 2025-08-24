import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
// import { LOCATION_API_KEY, GEOCODING_API_KEY } from '@env';

const GOOGLE_API_KEY  = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;
const GEOCODING_API_KEY      = process.env.EXPO_PUBLIC_GEOCODING_KEY || GOOGLE_PLACES_KEY;

export default function LocationPicker({ navigation }) {
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const mapRef = useRef(null);
  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          setLoading(false);
          return;
        }
        const currentLocation = await Location.getCurrentPositionAsync({});
        const coords = currentLocation.coords;

        if (isActive) {
          const loc = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: '',
          };
          setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setSelectedLocation(loc);
          setInitialLocation(loc);
          setLoading(false);
        }
      })();
      return () => {
        isActive = false;
      };
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length > 2) {
        fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${searchText}&key=${GOOGLE_API_KEY}&language=en`
        )
          .then(res => res.json())
          .then(data => setSuggestions(data.predictions || []))
          .catch(err => console.error('Autocomplete error:', err));
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSelectPlace = async (placeId, description) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const coords = data.result.geometry.location;

      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      mapRef.current?.animateToRegion(
        {
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );

      setSelectedLocation({
        latitude: coords.lat,
        longitude: coords.lng,
        name: data.result.formatted_address,
      });
      setSelectedName(data.result.formatted_address || data.result.name || description);
      setSuggestions([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Details fetch error:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No location selected', 'Tap on the map or select from list.');
      return;
    }

    const locationData = {
      ...selectedLocation,
      name:
        selectedName ||
        `Lat: ${selectedLocation.latitude.toFixed(
          4
        )}, Lng: ${selectedLocation.longitude.toFixed(4)}`,
    };

    if (route.params?.onLocationSelected) {
      route.params.onLocationSelected(locationData);
    }

    navigation.goBack();
  };

  const isLocationChanged =
    initialLocation &&
    selectedLocation &&
    (initialLocation.latitude !== selectedLocation.latitude ||
      initialLocation.longitude !== selectedLocation.longitude);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CreateEvent' }] })}
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search location"
            value={searchQuery}
            onChangeText={async text => {
              setSearchQuery(text);
              if (text.length > 2) {
                const response = await fetch(
                  `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}&components=country:us`
                );
                const json = await response.json();
                setSearchResults(json.predictions || []);
              } else {
                setSearchResults([]);
              }
            }}
            style={styles.searchInput}
          />

          {searchQuery.length > 2 && searchResults.length > 0 && (
            <View style={styles.resultOverlay}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map(result => (
                  <TouchableOpacity
                    key={result.place_id}
                    onPress={() => handleSelectPlace(result.place_id, result.description)}
                  >
                    <Text style={styles.resultItem}>{result.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
      <MapView
        style={styles.map}
        initialRegion={region}
        ref={mapRef}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={async e => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GEOCODING_API_KEY}`
            );
            const data = await res.json();
            const address =
              data?.results?.[0]?.formatted_address ||
              `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

            setSelectedLocation({ latitude, longitude, name: address });
            setSelectedName(address);
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          } catch (error) {
            const fallback = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
            setSelectedLocation({ latitude, longitude, name: fallback });
            setSelectedName(fallback);
          }
        }}
      >
        {selectedLocation?.latitude && selectedLocation?.longitude ? (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title="Selected Location"
            description={selectedName}
          />
        ) : null}
      </MapView>
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          (!selectedLocation || !isLocationChanged) && {
            backgroundColor: '#ccc',
          },
        ]}
        onPress={handleConfirm}
        disabled={!selectedLocation || !isLocationChanged}
      >
        <Text style={styles.confirmText}>Confirm Location</Text>
        {selectedLocation && (
          <Text style={styles.locationPreview}>
            {selectedName ? selectedName : `${selectedLocation?.name}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: '#FF822B',
    borderRadius: 10,
    bottom: 30,
    elevation: 5,
    left: 30,
    paddingVertical: 14,
    position: 'absolute',
    right: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  locationPreview: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
  },
  map: {
    flex: 1,
  },
  resultItem: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  resultOverlay: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    left: 0,
    marginTop: 4,
    maxHeight: 200,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    top: 52,
    zIndex: 25,
  },
  searchBox: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    left: 10,
    position: 'absolute',
    right: 20,
    top: 70,
    zIndex: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    fontSize: 16,
    height: 44,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});
