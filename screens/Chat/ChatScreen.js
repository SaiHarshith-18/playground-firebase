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
        await setDoc(
          chatRef,
          {
            users: [user.uid, chatUser.uid],
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
        unsubscribe = onSnapshot(
          q,
          snapshot => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          error => {
            console.error('Firestore snapshot error:', error);
          }
        );
      } catch (err) {
        console.error('Error initializing chat:', err);
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
        <UserAvatar avatar={chatUser.avatar} style={styles.headerAvatar} size={36} />
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
  botBubble: {
    backgroundColor: '#727472',
    borderTopLeftRadius: 0,
  },
  bubble: {
    borderRadius: 16,
    maxWidth: '70%',
    padding: 12,
  },
  bubbleText: {
    color: '#fff',
    fontSize: 14,
  },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  chatArea: {
    padding: 10,
  },
  container: { backgroundColor: '#fff', flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    padding: 15,
  },
  headerAvatar: {
    borderRadius: 18,
    height: 36,
    marginLeft: 10,
    width: 36,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#FF822B',
    borderRadius: 20,
    justifyContent: 'center',
    marginLeft: 8,
    padding: 10,
  },
  userBubble: {
    backgroundColor: '#FF822B',
    borderTopRightRadius: 0,
  },
});
