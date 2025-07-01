import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../firebaseConfig";
import { AuthContext } from "../../contexts/AuthContext";
import UserAvatar from "../../utils/UserAvatar";

export default function SuggestionsSection() {
  const [tab, setTab] = useState("Friends");
  const [users, setUsers] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      const unsubscribe = onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          const allUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const currentUser = allUsers.find((u) => u.id === user.uid);
          const others = allUsers.filter((u) => u.id !== user.uid);

          setLinkedUsers(currentUser?.friends || []);
          setSentRequests(currentUser?.sentRequests || []);
          setReceivedRequests(currentUser?.receivedRequests || []);
          setUsers(others);
        },
        (error) => {
          console.error("Firestore snapshot error:", error);
        }
      );

      return () => unsubscribe();
    }, [user?.uid])
  );

  const handleAddFriend = async (friendId) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const friendRef = doc(db, "users", friendId);

      await updateDoc(userRef, {
        sentRequests: arrayUnion(friendId),
      });

      await updateDoc(friendRef, {
        receivedRequests: arrayUnion(user.uid),
      });

      setSentRequests((prev) => [...prev, friendId]);
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const friendRef = doc(db, "users", friendId);

      await updateDoc(userRef, {
        friends: arrayUnion(friendId),
        receivedRequests: arrayRemove(friendId),
      });

      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid),
        sentRequests: arrayRemove(user.uid),
      });

      setLinkedUsers((prev) => [...prev, friendId]);
      setReceivedRequests((prev) => prev.filter((id) => id !== friendId));
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleMessage = (friend) => {
    navigation.navigate("Chat", { recipient: { ...friend, uid: friend.id } });
  };

  const renderFriend = ({ item }) => {
    const isFriend = linkedUsers.includes(item.id);
    const hasSentRequest = sentRequests.includes(item.id);
    const hasReceivedRequest = receivedRequests.includes(item.id);

    let actionButton;
    if (isFriend) {
      actionButton = (
        <TouchableOpacity
          style={[styles.friendAddButton, { backgroundColor: "#ccc" }]}
          onPress={() => handleMessage(item)}
        >
          <Text style={styles.addButtonText}>Message</Text>
        </TouchableOpacity>
      );
    } else if (hasSentRequest) {
      actionButton = (
        <View style={[styles.friendAddButton, { backgroundColor: "#999" }]}>
          <Text style={styles.addButtonText}>Request Sent</Text>
        </View>
      );
    } else if (hasReceivedRequest) {
      actionButton = (
        <TouchableOpacity
          style={[styles.friendAddButton, { backgroundColor: "#4CAF50" }]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.addButtonText}>Accept</Text>
        </TouchableOpacity>
      );
    } else {
      actionButton = (
        <TouchableOpacity
          style={styles.friendAddButton}
          onPress={() => handleAddFriend(item.id)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.friendCard}>
        <UserAvatar avatar={item.avatar} size={50} style={styles.friendAvatar} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.fullName || "Unnamed"}</Text>
          <Text style={styles.friendAbout}>
            {item.about || "No bio available"}
          </Text>
        </View>
        {actionButton}
      </View>
    );
  };

  const suggestions = users.filter(
    (u) =>
      !linkedUsers.includes(u.id) &&
      !sentRequests.includes(u.id) &&
      !receivedRequests.includes(u.id)
  );

  const friends = users.filter((u) => linkedUsers.includes(u.id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Suggestions</Text>
        <View style={styles.tabs}>
          {["Friends", "Squad"].map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.activeTab]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {tab === "Squad" ? (
            <View style={styles.emptySquadContainer}>
              <Text style={styles.emoji}>😔</Text>
              <Text style={styles.noSquadText}>No squads found</Text>
              <TouchableOpacity style={styles.createSquadButton}>
                <Text style={styles.createSquadText}>Create your squad</Text>
              </TouchableOpacity>
            </View>
        ) : (
          <View>
            {/* <Text style={styles.sectionTitle}>Suggestions</Text> */}
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderFriend}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled
              ListEmptyComponent={
                <Text style={{ textAlign: "center" }}>No suggestions.</Text>
              }
            />
            {!suggestions.length > 5 && (
              <>
                <Text style={styles.sectionTitle}>Your Friends</Text>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={renderFriend}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled
              ListEmptyComponent={
                <Text style={{ textAlign: "center" }}>No friends yet.</Text>
              }
            />
            </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { marginTop: 16, paddingHorizontal: 15, flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tabText: { fontSize: 16, color: "#aaa" },
  activeTab: {
    color: "#FF822B",
    borderBottomWidth: 2,
    borderColor: "#FF822B",
    paddingBottom: 4,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontWeight: "bold", fontSize: 14 },
  friendAbout: { color: "#666", fontSize: 12, marginTop: 2 },
  friendAddButton: {
    backgroundColor: "#FF822B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  emptySquadContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "80%"
  },
  emoji: { fontSize: 40, marginBottom: 10 },
  noSquadText: { fontSize: 16, color: "#555", marginBottom: 10 },
  createSquadButton: {
    backgroundColor: "#FF822B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createSquadText: { color: "#fff", fontWeight: "bold" },
});
