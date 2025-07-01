import React, { useEffect, useState, useContext } from "react";
import { Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";
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
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { AuthContext } from "../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import TodayUserEvents from "./Events/TodayUserEvents";
import UserAvatar from "../utils/UserAvatar";
import { IMGUR_CLIENT_ID } from "@env";

const screenWidth = Dimensions.get("window").width;
const ITEM_MARGIN = 4;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (screenWidth - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([{ id: "add" }]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfile = async () => {
        if (!user?.uid) return;
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfileData(data);
            setFormData({
              fullName: data.fullName || "",
              about: data.about || "",
            });
            const sortedMedia = (data.media || []).sort(
              (a, b) => b.createdAt - a.createdAt
            );
            setMedia([{ id: "add" }, ...sortedMedia]);
          } else {
            setProfileData({});
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
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
      const userRef = doc(db, "users", user.uid);
      const updatedProfile = {
        ...profileData,
        fullName: formData.fullName,
        about: formData.about,
      };
      await setDoc(userRef, updatedProfile, { merge: true });
      setProfileData(updatedProfile);
      setEditMode(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert("Permission required!");

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
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { avatar: imgurUrl });
        setProfileData((prev) => ({ ...prev, avatar: imgurUrl }));
      } catch (err) {
        console.error("Error updating avatar:", err);
        Alert.alert("Error", "Failed to upload image");
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { avatar: "" });
      setProfileData((prev) => ({ ...prev, avatar: "" }));
      Alert.alert("Removed", "Profile photo removed.");
    } catch (err) {
      console.error("Error removing avatar:", err);
      Alert.alert("Error", "Failed to remove profile photo");
    }
  };

  const uploadToImgur = async (uri) => {
    const base64Img = await fetch(uri)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(blob);
          })
      );

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Img,
        type: "base64",
      }),
    });

    const result = await response.json();
    if (result.success) return result.data.link;
    throw new Error("Image upload failed");
  };

  const addNewMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert("Permission required!");

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
        Alert.prompt(
          "Add caption",
          "What's on your mind?",
          async (captionText) => {
            const newPost = {
              id: Date.now().toString(),
              url: imgurUrl,
              caption: captionText || "",
              createdAt: Date.now(),
            };
            const updatedMedia = [
              newPost,
              ...media.filter((item) => item.id !== "add"),
            ];
            const sortedMedia = updatedMedia.sort(
              (a, b) => b.createdAt - a.createdAt
            );
            setMedia([{ id: "add" }, ...sortedMedia]);
            await updateDoc(doc(db, "users", user.uid), { media: sortedMedia });
          }
        );
      } catch (err) {
        console.error("Image upload failed:", err);
        Alert.alert("Error", "Image upload failed");
      }
    }
  };

  const fullName = formData.fullName || "User";
  const avatar = profileData?.avatar;
  const followers = profileData?.followers ?? 0;
  const following = profileData?.following ?? 0;
  const about = formData.about || "";
  const posts = media.filter((item) => item.id !== "add").length;
  const mediaWithoutAdd = media.filter((item) => item.id !== "add");

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
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
            <View style={styles.avatarWrapper}>
              <UserAvatar avatar={avatar} style={styles.avatar} />
              {editMode && (
                <>
                  {/* Edit (change photo) icon - bottom right */}
                  <TouchableOpacity
                    style={styles.editPhotoIcon}
                    onPress={pickImage}
                  >
                    <Feather name="edit-2" size={16} color="#fff" />
                  </TouchableOpacity>
                  {/* Delete (remove photo) icon - bottom left */}
                  {avatar ? (
                    <TouchableOpacity
                      style={styles.deletePhotoIcon}
                      onPress={handleRemovePhoto}
                    >
                      <Feather name="trash-2" size={16} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
            <View style={styles.statsRow}>
              {[
                { label: "Posts", value: posts },
                { label: "Followers", value: followers },
                { label: "Following", value: following },
              ].map((stat) => (
                <View key={stat.label} style={styles.statBox}>
                  <Text style={styles.statNumber}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bioSection}>
            {editMode ? (
              <>
                <TextInput
                  style={styles.inputName}
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                />
                <TextInput
                  style={styles.inputAbout}
                  value={formData.about}
                  onChangeText={(text) =>
                    setFormData({ ...formData, about: text })
                  }
                  multiline
                  placeholder="Write something about yourself..."
                />
              </>
            ) : (
              <>
                <Text style={styles.name}>{fullName}</Text>
                <Text style={styles.aboutText}>
                  {about || "No bio added yet."}
                </Text>
              </>
            )}
          </View>
          {!editMode && (
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Suggestions")}
              >
                <Ionicons name="people-outline" size={26} color="#FF822B" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos and Videos</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AllMedia")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaPreviewRow}
          >
            <TouchableOpacity
              onPress={addNewMedia}
              style={styles.previewAddBox}
            >
              <Ionicons name="add" size={28} color="#FF822B" />
            </TouchableOpacity>
            {mediaWithoutAdd.map((item) => (
              <View
                key={item.id}
                style={{ position: "relative", marginRight: 10 }}
              >
                <Image source={{ uri: item.url }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.threeDots}
                  onPress={() =>
                    navigation.navigate("PostDetail", {
                      post: item,
                      onDelete: async (id) => handleDeletePost(id),
                      onEdit: async (post) => handleEditPost(post),
                    })
                  }
                >
                  <Feather name="more-vertical" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Events</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AllUserEvents")}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <TodayUserEvents navigation={navigation} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 15,
    // paddingVertical: 18,
  },
  editIcons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    marginBottom: 10,
    gap: 15,
  },
  profileRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  avatarWrapper: { position: "relative" },
  defaultAvatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF822B",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    borderWidth: 2,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 15,
  },
  statBox: { alignItems: "center" },
  statNumber: { fontWeight: "bold", fontSize: 16 },
  statLabel: { fontSize: 13, color: "#555" },
  bioSection: { marginTop: 12 },
  name: { fontWeight: "bold", fontSize: 16 },
  aboutText: { fontSize: 14, color: "#444", marginTop: 4 },
  inputName: {
    fontSize: 16,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 4,
  },
  inputAbout: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    minHeight: 40,
    textAlignVertical: "top",
  },
  profileActions: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    marginTop: 12,
  },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    minWidth: "85%",
  },
  editProfileText: { fontSize: 14, fontWeight: "bold", color: "#333" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 18,
  },
  sectionTitle: { fontWeight: "bold", fontSize: 16 },
  seeAllText: { color: "#FF822B", fontSize: 14 },
  mediaPreviewRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 10,
    marginLeft: 4,
  },
  previewAddBox: {
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: "#FF822B",
    borderStyle: "dashed",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  previewImage: { width: 110, height: 110, borderRadius: 10 },
  threeDots: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
  editPhotoIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF822B",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    borderWidth: 2,
    zIndex: 2,
  },
  deletePhotoIcon: {
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundColor: "#FF3B30",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    borderWidth: 2,
    zIndex: 2,
  },
});
