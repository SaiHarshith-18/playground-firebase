/* eslint-disable react-native/no-color-literals */
import React, { useState, useContext } from 'react';
import * as FileSystem from 'expo-file-system';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import TodayUserEvents from './Events/TodayUserEvents';
import Svg, { Path } from 'react-native-svg';

export default function ProfileScreen() {
  const IMGUR_CLIENT_ID = process.env.EXPO_PUBLIC_IMGUR_CLIENT_ID;
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([{ id: 'add' }]);
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        if (!user?.uid) return;
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfileData(data);
            setFormData({
              fullName: data.fullName || '',
              about: data.about || '',
            });
            const sortedMedia = (data.media || []).sort((a, b) => b.createdAt - a.createdAt);
            setMedia([{ id: 'add' }, ...sortedMedia]);
          } else {
            setProfileData({});
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }, [user])
  );

  const handleSave = async () => {
    if (!user?.uid) return;
    try {
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert('Permission required!');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const imgurUrl = await uploadToImgur(uri); // Upload to Imgur
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatar: imgurUrl });
        setProfileData(prev => ({ ...prev, avatar: imgurUrl }));
        setMenuVisible(false);
      } catch (err) {
        console.error('Error updating avatar:', err);
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { avatar: '' });
      setProfileData(prev => ({ ...prev, avatar: '' }));
      Alert.alert('Removed', 'Profile photo removed.');
      setMenuVisible(false);
    } catch (err) {
      console.error('Error removing avatar:', err);
      Alert.alert('Error', 'Failed to remove profile photo');
    }
  };

  const uploadToImgur = async (uri) => {
    const base64Img = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Img, type: 'base64' }),
    });
  
    const result = await response.json();
    if (result.success) return result.data.link;
    throw new Error(result.data.error || 'Image upload failed');
  };

  const addNewMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert('Permission required!');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const imgurUrl = await uploadToImgur(uri); // Upload to Imgur
        Alert.prompt('Add caption', "What's on your mind?", async captionText => {
          const newPost = {
            id: Date.now().toString(),
            url: imgurUrl,
            caption: captionText || '',
            createdAt: Date.now(),
          };
          const updatedMedia = [newPost, ...media.filter(item => item.id !== 'add')];
          const sortedMedia = updatedMedia.sort((a, b) => b.createdAt - a.createdAt);
          setMedia([{ id: 'add' }, ...sortedMedia]);
          await updateDoc(doc(db, 'users', user.uid), { media: sortedMedia });
        });
      } catch (err) {
        console.error('Image upload failed:', err);
        Alert.alert('Error', 'Image upload failed');
      }
    }
  };

  const fullName = formData.fullName || 'User';
  const avatar = profileData?.avatar;
  const friends = profileData?.friends ?? [];
  const sentRequests = profileData?.sentRequests ?? [];
  const followers = friends.length;
  const following = friends.length + sentRequests.length;
  const about = formData.about || '';
  const posts = media.filter(item => item.id !== 'add').length;
  const mediaWithoutAdd = media.filter(item => item.id !== 'add');

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inner}
        bounces={false}
        overScrollMode="never"
      >
        <View>
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

          <View style={styles.profileRow}>
            <View style={styles.coverContainer}>
              <Image
                source={avatar ? { uri: avatar } : require('../assets/no_image.png')}
                style={avatar ? styles.coverImage : styles.defaultAvatar}
              />
              <View style={styles.threeDotsMenu}>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                      <Feather name="more-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item onPress={pickImage} title="Edit Photo" />
                  <Menu.Item onPress={handleRemovePhoto} title="Delete Photo" />
                </Menu>
              </View>
              <Svg
                height={80}
                width="100%"
                viewBox="0 0 1440 200"
                style={{ position: 'absolute', bottom: -1 }}
              >
                <Path
                  fill="#fff"
                  d="M0,96L60,122.7C120,149,240,203,360,197.3C480,192,600,128,720,101.3C840,75,960,85,1080,101.3C1200,117,1320,139,1380,149.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                />
              </Svg>
            </View>
            <View style={styles.bioSection}>
              {editMode ? (
                <>
                  <TextInput
                    style={styles.inputName}
                    value={formData.fullName}
                    onChangeText={text => setFormData({ ...formData, fullName: text })}
                  />
                  <TextInput
                    style={styles.inputAbout}
                    value={formData.about}
                    onChangeText={text => setFormData({ ...formData, about: text })}
                    multiline
                    placeholder="Write something about yourself..."
                  />
                </>
              ) : (
                <>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{fullName}</Text>
                    {!editMode && (
                      <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editIcon}>
                        <Feather name="edit-3" size={18} color="#FF822B" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.aboutText}>{about || 'No bio added yet.'}</Text>
                </>
              )}
            </View>

            {/* <View style={styles.avatarCircle}>
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            </View> */}
            <View style={styles.statsRow}>
              {[
                { label: 'Posts', value: posts },
                { label: 'Followers', value: followers },
                { label: 'Following', value: following },
                {
                  label: 'Suggestions',
                  value: (
                    <TouchableOpacity onPress={() => navigation.navigate('Suggestions')}>
                      <Ionicons name="people-outline" size={20} color="#FF822B" />
                    </TouchableOpacity>
                  ),
                },
              ].map(stat => (
                <View key={stat.label} style={styles.statBox}>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Media</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllMedia')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaPreviewRow}
          >
            <TouchableOpacity onPress={addNewMedia} style={styles.previewAddBox}>
              <Ionicons name="add" size={28} color="#FF822B" />
            </TouchableOpacity>
            {mediaWithoutAdd.map(item => (
              <View key={item.id} style={{ position: 'relative', marginRight: 10 }}>
                <Image source={{ uri: item.url }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.threeDots}
                  onPress={() =>
                    navigation.navigate('PostDetail', {
                      post: item,
                    })
                  }
                >
                  <Feather name="more-vertical" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&#39;s Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllUserEvents')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <TodayUserEvents navigation={navigation} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aboutText: { color: '#666666', fontSize: 14, marginTop: 4, textAlign: 'center' },
  bioSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: { backgroundColor: '#ffffff', flex: 1 },
  coverContainer: {
    alignItems: 'center',
    height: 400,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  coverImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  defaultAvatar: {
    height: '30%',
    resizeMode: 'contain',
    width: '30%',
  },
  editIcon: {
    padding: 4,
  },
  editIcons: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'flex-end',
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  inner: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  inputAbout: {
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 40,
    padding: 8,
    textAlign: 'center',
    textAlignVertical: 'top',
  },
  inputName: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  mediaPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
    paddingLeft: 15,
  },
  name: { color: '#333', fontSize: 20, fontWeight: 'bold' },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  previewAddBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#FF822B',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 110,
    justifyContent: 'center',
    width: 110,
  },
  previewImage: { borderRadius: 10, height: 110, width: 110 },
  profileRow: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  seeAllText: { color: '#FF822B', fontSize: 14 },
  statBox: { alignItems: 'center' },
  statLabel: { color: '#777', fontSize: 13 },
  statNumber: { color: '#222', fontSize: 18, fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },

  threeDots: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
    position: 'absolute',
    right: 6,
    top: 6,
  },
  threeDotsMenu: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 4,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
  },
});
