// ChatScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route }) {
  const { chatUser } = route.params;
  const [messages, setMessages] = useState([
  ]);
  const [inputText, setInputText] = useState('');

  const autoReplies = {
    hi: 'Hey there! \uD83D\uDC4B',
    hello: 'Hello! How are you?',
    hey: 'Hi! Looking for a game buddy?',
    game: 'Let’s schedule a match! \uD83C\uDFC0',
    thanks: 'You’re welcome! \uD83D\uDE0A',
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      from: 'user',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      const lower = inputText.toLowerCase();
      const reply = autoReplies[lower] || "I'm not sure how to respond to that.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: reply, from: 'bot' },
      ]);
    }, 1000);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.from === 'user';
    const profileImage = isUser
      ? 'https://randomuser.me/api/portraits/women/44.jpg'
      : 'https://randomuser.me/api/portraits/men/32.jpg';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && <Image source={{ uri: profileImage }} style={styles.avatar} />}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userText]}>{item.text}</Text>
        </View>
        {isUser && <Image source={{ uri: profileImage }} style={styles.avatar} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#FF822B" />
        <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.headerAvatar} />
        <Text style={styles.headerTitle}>{chatUser?.fullName || 'Allen Iverson'}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatArea}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#FF822B',
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: '#f2f2f2',
    borderTopRightRadius: 0,
  },
  bubbleText: {
    fontSize: 14,
    color: '#fff',
  },
  userText: {
    color: '#333',
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
