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
      navigation.goBack();
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
          navigation.goBack();
        });
      }
    } catch (error) {
      Alert.alert('Edit Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()}>
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
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  image: {
    width: '100%',
    height: '60%',
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    width: '80%',
    padding: 14,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
