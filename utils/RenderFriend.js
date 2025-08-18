import { useState } from 'react';
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
import UserAvatar from './UserAvatar';

export const RenderFriend = ({
  item,
  user,
  linkedUsers,
  onAddFriend,
  onAcceptRequest,
  onMessage,
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
      <TouchableOpacity style={styles.friendAddButton} onPress={() => onAddFriend(item.id)}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.friendCard}>
      <UserAvatar avatar={item.avatar} style={styles.friendAvatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.fullName || 'Unnamed'}</Text>
        <Text style={styles.friendAbout}>{item.about || 'No bio available'}</Text>
      </View>
      {actionButton}
    </View>
  );
};

const styles = StyleSheet.create({
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  friendAbout: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  friendAddButton: {
    backgroundColor: '#FF822B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  friendAvatar: {
    borderRadius: 25,
    height: 50,
    marginRight: 12,
    width: 50,
  },
  friendCard: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 10,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
