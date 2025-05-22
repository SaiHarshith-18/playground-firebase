import React, { useEffect, useState, useContext } from 'react';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import * as ImagePicker from "expo-image-picker";

const screenWidth = Dimensions.get('window').width;
const ITEM_MARGIN = 4;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (screenWidth - (ITEM_MARGIN * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const [media, setMedia] = useState([
    { id: 'add' }, // first box for adding media
  ]);
  const [showAllMedia, setShowAllMedia] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user?.uid) return;
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setFormData({
            fullName: data.fullName || '',
            about: data.about || '',
          });
          const dbMedia = data.media || [];
          setMedia([{ id: 'add' }, ...dbMedia]);
        } else {
          setProfileData({});
          setFormData({ fullName: '', about: '' });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) fetchProfile();
  }, [user]);

  const navigation = useNavigation();

  const handleSave = async () => {
    try {
      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile = {
        ...profileData,
        fullName: formData.fullName,
        about: formData.about,
      };

      await setDoc(userRef, updatedProfile, { merge: true });
      setProfileData(updatedProfile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

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
      if (user?.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { avatar: uri });
          setProfileData({ ...profileData, avatar: uri });
        } catch (error) {
          console.error('Error updating avatar:', error);
        }
      }
    }
  };


  const addNewMedia = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission is required to access media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.IMAGE],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      Alert.prompt("Add caption", "What's on your mind?", async (captionText) => {
        const newPost = {
          id: Date.now().toString(),
          url: uri,
          caption: captionText || '',
          createdAt: Date.now(),
        };

        const updatedMedia = [newPost, ...media.filter(item => item.id !== 'add')];
        setMedia([{ id: 'add' }, ...updatedMedia]);

        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { media: updatedMedia });
        } catch (error) {
          console.error('Error saving post:', error);
        }
      });
    }
  };

  const handleDeletePost = async (postId) => {
    const updated = media.filter(item => item.id !== postId && item.id !== 'add');
    setMedia([{ id: 'add' }, ...updated]);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { media: updated });
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };



  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  const fullName = formData.fullName || 'User';
  const avatar = profileData?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg';
  const followers = profileData?.followers ?? 0;
  const following = profileData?.following ?? 0;
  const about = formData.about || '';
  const posts = media.filter(item => item.id !== 'add').length;

  const mediaWithoutAdd = media.filter((item) => item.id !== 'add').slice().reverse();



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header Icons */}
        <View style={styles.editIcons}>
          {editMode && (
            <>
              <TouchableOpacity onPress={handleSave}>
                <Ionicons name="checkmark-done" size={26} color="#4CAF50" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Ionicons name="close" size={26} color="#f00" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatar }} style={styles.avatar} />

            {editMode && (
              <TouchableOpacity style={styles.addPhotoIcon} onPress={pickImage}>
                <Feather name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Name + About */}
        <View style={styles.bioSection}>
          {editMode ? (
            <>
              <TextInput
                style={styles.inputName}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              />
              <TextInput
                style={styles.inputAbout}
                value={formData.about}
                onChangeText={(text) => setFormData({ ...formData, about: text })}
                multiline
                placeholder="Write something about yourself..."
              />
            </>
          ) : (
            <>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.aboutText}>{about || 'No bio added yet.'}</Text>
            </>
          )}
        </View>

<View style={{flexDirection: 'row', gap: 15,alignItems: 'center'}}>
        {/* Edit Profile Button */}
        {!editMode && (
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditMode(true)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
         <TouchableOpacity onPress={() => navigation.navigate('Suggestions')}>
                <Ionicons name="person-add-outline" size={26} color="#FF822B" />
              </TouchableOpacity>
              </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photos and Videos</Text>
          <TouchableOpacity onPress={() => setShowAllMedia(true)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal preview row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaPreviewRow}
        >
          {/* Upload button */}
          <TouchableOpacity onPress={addNewMedia} style={styles.previewAddBox}>
            <Ionicons name="add" size={28} color="#FF822B" />
          </TouchableOpacity>

          {/* Show latest 2 uploaded images */}

          {mediaWithoutAdd.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate('PostDetail', {
                  media: mediaWithoutAdd, // full media list
                  index, // current post index
                })
              }
            >
              <Image source={{ uri: item.url }} style={styles.previewImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPost && (
          <View style={styles.fullPostOverlay}>
            <TouchableOpacity
              style={styles.closeOverlay}
              onPress={() => setSelectedPost(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: selectedPost.url }} style={styles.fullPostImage} />
            <Text style={styles.fullPostCaption}>{selectedPost.caption}</Text>
            <TouchableOpacity onPress={() => handleDeletePost(selectedPost.id)}>
              <Text style={styles.deleteText}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* See all */}
        {showAllMedia && (
          <View style={styles.mediaModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Media</Text>
              <TouchableOpacity key="add-media" onPress={() => setShowAllMedia(false)}>
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.mediaGrid}>
              {media
                .filter((item) => item.id !== 'add')
                .slice()
                .reverse() // Newest first
                .map((item) => (
                  <Image
                    key={item.id}
                    source={{ uri: item.url }}
                    style={styles.modalMediaImage}
                  />
                ))}
            </ScrollView>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  editIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 10,
    gap: 15,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  avatarWrapper: {
    position: 'relative',
  },
  addPhotoIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF822B',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#fff',
    borderWidth: 2,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#555',
  },
  bioSection: {
    marginTop: 12,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutText: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  inputName: {
    fontSize: 16,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 4,
  },
  inputAbout: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    width: '85%',
    marginTop: 12,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  mediaSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 20
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  seeAllText: {
    color: '#FF822B',
    fontSize: 14,
  },
  addMediaBox: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: ITEM_MARGIN,
    borderWidth: 2,
    borderColor: '#FF822B',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  mediaPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
    marginLeft: 4
  },
  previewAddBox: {
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: '#FF822B',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
  },
  mediaModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  fullPostOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  fullPostImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  fullPostCaption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  closeOverlay: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  deleteText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12
  },

  modalMediaImage: {
    width: 100,
    height: 100,
    // marginRight: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
