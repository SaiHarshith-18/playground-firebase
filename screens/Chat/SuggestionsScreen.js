import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { AuthContext } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function MessageScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mySentRequests, setMySentRequests] = useState([]);
  const [myReceivedRequests, setMyReceivedRequests] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const allUsers = snapshot.docs
        .filter((doc) => doc.id !== user.uid)
        .map((doc) => ({ uid: doc.id, ...doc.data() }));

      const currentUserDoc = await getDoc(doc(db, "users", user.uid));
      const currentUserData = currentUserDoc.data();
      const friends = currentUserData.friends || [];

      setConnectedUsers(allUsers.filter((u) => friends.includes(u.uid)));
      setSuggestedUsers(allUsers.filter((u) => !friends.includes(u.uid)));
      setMySentRequests(currentUserData.sentRequests || []);
      setMyReceivedRequests(currentUserData.receivedRequests || []);
    };
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const fetchSearchResults = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const results = snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return (
            doc.id !== user.uid &&
            data.fullName &&
            data.fullName.toLowerCase().includes(search.toLowerCase())
          );
        })
        .map((doc) => ({ uid: doc.id, ...doc.data() }));
      setSearchResults(results);
    };
    fetchSearchResults();
  }, [search, user.uid]);

  const handleSendRequest = async (targetUser) => {
    const userRef = doc(db, "users", user.uid);
    const targetRef = doc(db, "users", targetUser.uid);

    const userSnap = await getDoc(userRef);
    const targetSnap = await getDoc(targetRef);
    const userData = userSnap.data();
    const targetData = targetSnap.data();

    const sent = userData.sentRequests || [];
    const received = targetData.receivedRequests || [];

    if (!sent.includes(targetUser.uid)) {
      await updateDoc(userRef, {
        sentRequests: [...sent, targetUser.uid],
      });
      setMySentRequests((prev) => [...prev, targetUser.uid]);
    }

    if (!received.includes(user.uid)) {
      await updateDoc(targetRef, {
        receivedRequests: [...received, user.uid],
      });
    }
  };

  const handleAcceptRequest = async (targetUser) => {
    const userRef = doc(db, "users", user.uid);
    const targetRef = doc(db, "users", targetUser.uid);
    const userSnap = await getDoc(userRef);
    const targetSnap = await getDoc(targetRef);
    const userData = userSnap.data();
    const targetData = targetSnap.data();

    await updateDoc(userRef, {
      friends: [...new Set([...(userData.friends || []), targetUser.uid])],
      receivedRequests: (userData.receivedRequests || []).filter(
        (uid) => uid !== targetUser.uid
      ),
    });
    setConnectedUsers((prev) => [...prev, targetUser]);
    setMyReceivedRequests((prev) =>
      prev.filter((uid) => uid !== targetUser.uid)
    );

    await updateDoc(targetRef, {
      friends: [...new Set([...(targetData.friends || []), user.uid])],
      sentRequests: (targetData.sentRequests || []).filter(
        (uid) => uid !== user.uid
      ),
    });
  };

  const handleCancelRequest = async (targetUser) => {
    const userRef = doc(db, "users", user.uid);
    const targetRef = doc(db, "users", targetUser.uid);
    const userSnap = await getDoc(userRef);
    const targetSnap = await getDoc(targetRef);
    const userData = userSnap.data();
    const targetData = targetSnap.data();

    await updateDoc(userRef, {
      sentRequests: (userData.sentRequests || []).filter(
        (uid) => uid !== targetUser.uid
      ),
    });
    setMySentRequests((prev) => prev.filter((uid) => uid !== targetUser.uid));

    await updateDoc(targetRef, {
      receivedRequests: (targetData.receivedRequests || []).filter(
        (uid) => uid !== user.uid
      ),
    });
  };

  const navigateToChat = (friend) => {
    navigation.navigate("Chat", { recipient: friend });
  };

  const renderUserItem = ({ item }) => {
    const isConnected = connectedUsers.some((u) => u.uid === item.uid);
    const hasSentRequest = mySentRequests.includes(item.uid);
    const hasReceivedRequest = myReceivedRequests.includes(item.uid);
    return (
      <View style={styles.userCard}>
        <Text style={styles.userName}>{item.fullName}</Text>
        {isConnected ? (
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigateToChat(item)}
          >
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.connectBtnText}>Chat</Text>
          </TouchableOpacity>
        ) : hasReceivedRequest ? (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAcceptRequest(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.connectBtnText}>Accept</Text>
          </TouchableOpacity>
        ) : hasSentRequest ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancelRequest(item)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#fff" />
            <Text style={styles.connectBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => handleSendRequest(item)}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ...existing code...
return (
  <SafeAreaView style={styles.container}>
    <View style={{ paddingHorizontal: 16 }}>
      <Text style={styles.title}>Suggestions</Text>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name..."
        placeholderTextColor="#888"
      />
      {search.trim() ? (
        <>
          <Text style={styles.subHeading}>Search Results</Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
            renderItem={renderUserItem}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: "#888", marginTop: 32 }}>
                No users found.
              </Text>
            }
          />
        </>
      ) : suggestedUsers.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#888", marginTop: 32 }}>
          No suggestions found. Try connecting with more people!
        </Text>
      ) : (
        <FlatList
          data={suggestedUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "#888", marginTop: 32 }}>
              No suggestions found. Try connecting with more people!
            </Text>
          }
        />
      )}
    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 14,
    backgroundColor: "#f9f9f9",
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: { fontSize: 16 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF822B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  connectBtnText: { color: "#fff", marginLeft: 6 },
  messageBtn: {
    backgroundColor: "grey",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50", // Green
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30", // Red
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
});
