import React, { useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params;
  const { user } = useContext(AuthContext);

  const handleDelete = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const filteredMedia = (data.media || []).filter(item => item.id !== post.id);
        await setDoc(userRef, { media: filteredMedia }, { merge: true });
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp', params: { screen: 'Profile' } }],
      });
      Alert.alert('Post Deleted', 'Your media post was successfully removed.');
    } catch (error) {
      Alert.alert('Delete Failed', error.message);
    }
  };

  const handleEdit = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission is required to access media library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        Alert.prompt('Edit caption', 'Update your caption:', async newCaption => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            const updatedMedia = (data.media || []).map(item =>
              item.id === post.id
                ? {
                    ...item,
                    url: newUri,
                    caption: newCaption || item.caption,
                    updatedAt: Date.now(),
                  }
                : item
            );
            await updateDoc(userRef, { media: updatedMedia });
          }
          navigation.replace('MainApp', { screen: 'Profile' });
        });
      }
    } catch (error) {
      Alert.alert('Edit Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.close}
        onPress={() => navigation.reset('MainApp', { screen: 'Profile' })}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <Image source={{ uri: post.url }} style={styles.image} />
      <Text style={styles.caption}>{post.caption}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#4CAF50' }]}
        onPress={handleEdit}
      >
        <Text style={styles.buttonText}>Edit Post</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#FF3B30' }]}
        onPress={() => {
          Alert.alert('Confirm', 'Are you sure you want to delete?', [
            { text: 'Cancel' },
            { text: 'Delete', onPress: handleDelete, style: 'destructive' },
          ]);
        }}
      >
        <Text style={styles.buttonText}>Delete Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
    padding: 14,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  close: {
    position: 'absolute',
    right: 20,
    top: 40,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  image: {
    borderRadius: 12,
    height: '60%',
    marginBottom: 20,
    resizeMode: 'cover',
    width: '100%',
  },
});
