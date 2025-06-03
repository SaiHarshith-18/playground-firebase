import React, { useState, useEffect } from 'react';
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
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const GOOGLE_API_KEY = 'AIzaSyAObLDuaPZWJLEy4_uMOzSqtvbRfTp43FE'; // Replace with your real key

export default function LocationPicker({ navigation }) {
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        setLoading(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const coords = currentLocation.coords;
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length > 2) {
        fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${searchText}&key=${GOOGLE_API_KEY}&language=en`
        )
          .then((res) => res.json())
          .then((data) => setSuggestions(data.predictions || []))
          .catch((err) => console.error('Autocomplete error:', err));
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
      setSelectedLocation({ latitude: coords.lat, longitude: coords.lng });
      setSelectedName(description);
      setSuggestions([]);
      setSearchText(description);
    } catch (error) {
      console.error('Details fetch error:', error);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('No location selected', 'Tap on the map or select from list.');
      return;
    }
    navigation.navigate({
      name: 'CreateEvent',
      params: {
        selectedLocation: {
          ...selectedLocation,
          name:
            selectedName ||
            `Lat: ${selectedLocation.latitude.toFixed(4)}, Lng: ${selectedLocation.longitude.toFixed(4)}`,
        },
      },
      merge: true,
    });
  };

  if (loading || !region) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
       <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search location"
          value={searchQuery}
          onChangeText={async (text) => {
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
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.place_id}
                  onPress={async () => {
                    const detailsResp = await fetch(
                      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.place_id}&key=${GOOGLE_API_KEY}`
                    );
                    const detailsJson = await detailsResp.json();
                    const coords = detailsJson.result.geometry.location;
                    setSelectedLocation({ latitude: coords.lat, longitude: coords.lng });
                    setSelectedName(detailsJson.result.name);
                    setRegion({
                      latitude: coords.lat,
                      longitude: coords.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <Text style={styles.resultItem}>{result.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <MapView
        style={styles.map}
        region={region}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setSelectedLocation({ latitude, longitude });
          setSelectedName('');
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title="Selected Location" description={selectedName} />
        )}
      </MapView>
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm Location</Text>
        {selectedLocation && (
          <Text style={styles.locationPreview}>
            {selectedName
              ? selectedName
              : `Lat: ${selectedLocation.latitude.toFixed(4)}, Lng: ${selectedLocation.longitude.toFixed(4)}`}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  searchBox: {
  position: 'absolute',
  top: 20,
  left: 20,
  right: 20,
  zIndex: 10,
},

searchInput: {
  height: 44,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderRadius: 8,
  paddingHorizontal: 10,
  fontSize: 16,
  borderColor: '#ccc',
  borderWidth: 1,
},

resultOverlay: {
  maxHeight: 200,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: 8,
  marginTop: 8,
},
resultItem: {
  padding: 10,
  borderBottomColor: '#ddd',
  borderBottomWidth: 1,
  fontSize: 14,
},
  // suggestionItem: {
  //   backgroundColor: '#eee',
  //   padding: 10,
  //   marginHorizontal: 10,
  //   borderBottomWidth: 1,
  //   borderColor: '#ddd',
  // },
  map: { flex: 1 },
  confirmBtn: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    backgroundColor: '#FF822B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationPreview: {
    marginTop: 6,
    fontSize: 12,
    color: '#fff',
  },
});
