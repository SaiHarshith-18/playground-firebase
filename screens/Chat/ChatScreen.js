import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import UserAvatar from '../../utils/UserAvatar';

export default function ChatScreen({ route, navigation }) {
  const { recipient: chatUser } = route.params || {};
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const chatId = user && chatUser ? [user.uid, chatUser.uid].sort().join('_') : null;

 useEffect(() => {
  let unsubscribe;

  const initChat = async () => {
    if (!user || !chatUser || !chatId) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        users: [user.uid, chatUser.uid],
        createdAt: serverTimestamp(),
      }, { merge: true });

      const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
      unsubscribe = onSnapshot(
        q,
        snapshot => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        error => {
          console.error("Firestore snapshot error:", error);
        }
      );
    } catch (err) {
      console.error("Error initializing chat:", err);
    }
  };

  initChat();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [user, chatUser, chatId]);


  const checkFriendshipBeforeSend = async () => {
    if (!user) return false;
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    const data = docSnap.data();
    if (!data) return false;
    const friendList = data.friends || [];
    return friendList.includes(chatUser.uid);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const allowed = await checkFriendshipBeforeSend();
    if (!allowed) {
      alert('You must connect before chatting.');
      return;
    }
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: inputText,
      from: user.uid,
      to: chatUser.uid,
      createdAt: serverTimestamp(),
    });
    setInputText('');
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.from === user.uid;
    return (
      <View
        style={[styles.messageRow, { justifyContent: isCurrentUser ? 'flex-end' : 'flex-start' }]}
      >
        <View style={[styles.bubble, isCurrentUser ? styles.userBubble : styles.botBubble]}>
          <Text style={styles.bubbleText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (!user || !chatUser) {
    return (
      <View style={styles.centered}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FF822B" />
        </TouchableOpacity>
        <UserAvatar avatar={chatUser.avatar} style={styles.headerAvatar} />
        <Text style={styles.headerTitle}>{chatUser.fullName || 'Chat User'}</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.chatArea,
          messages.length === 0 && { flex: 1, justifyContent: 'center' },
        ]}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: 'center', color: '#aaa' }}>Start a conversation...</Text>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
        style={styles.inputWrapper}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chatArea: {
    padding: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#727472',
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: '#FF822B',
    borderTopRightRadius: 0,
  },
  bubbleText: {
    fontSize: 14,
    color: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#FF822B',
    padding: 10,
    borderRadius: 20,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
