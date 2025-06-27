 import {useState} from "react";
 import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from "../../utils/UserAvatar";

 
 export const RenderFriend = ({
    item,
    user,
    linkedUsers,
    onAddFriend,
    onAcceptRequest,
    onMessage
  }) => {
  const [imageError, setImageError] = useState(false);
  const currentUserId = user?.uid;
  const isFriend = linkedUsers.includes(item.id);
  const hasSentRequest = item?.receivedRequests?.includes(currentUserId);
  const hasReceivedRequest = item?.sentRequests?.includes(currentUserId);

  let actionButton;
  if (isFriend) {
    actionButton = (
      <TouchableOpacity
        style={[styles.friendAddButton, { backgroundColor: '#ccc' }]}
        onPress={() => onMessage(item)}
      >
        <Text style={styles.addButtonText}>Message</Text>
      </TouchableOpacity>
    );
  } else if (hasSentRequest) {
    actionButton = (
      <View style={[styles.friendAddButton, { backgroundColor: '#999' }]}>
        <Text style={styles.addButtonText}>Request Sent</Text>
      </View>
    );
  } else if (hasReceivedRequest) {
    actionButton = (
      <TouchableOpacity
        style={[styles.friendAddButton, { backgroundColor: '#4CAF50' }]}
        onPress={() => onAcceptRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Accept</Text>
      </TouchableOpacity>
    );
  } else {
    actionButton = (
      <TouchableOpacity
        style={styles.friendAddButton}
        onPress={() => onAddFriend(item.id)}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.friendCard}>
      <UserAvatar avatar={item.avatar} style={styles.friendAvatar}  />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.fullName || 'Unnamed'}</Text>
        <Text style={styles.friendAbout}>{item.about || 'No bio available'}</Text>
      </View>
      {actionButton}
    </View>
  );
};

const styles = StyleSheet.create({
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  friendAbout: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  friendAddButton: {
    backgroundColor: '#FF822B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
})