import React, { useEffect, useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);

  useFocusEffect(
    useCallback(() => {
    const fetchData = async () => {
      setLoading(true);

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

      // Fetch avatar from Firestore
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

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);

      // Save avatar to Firestore
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { avatar: uri });
        } catch (error) {
          console.error('Error updating avatar:', error);
        }
      }
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
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            pinColor="red"
          />
        </MapView>
      </View>

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
        <TouchableOpacity style={styles.plusButton}>
          <Feather name="plus" size={38} color="orange" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    opacity: 0.75
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