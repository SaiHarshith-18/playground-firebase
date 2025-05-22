import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function PostDetailScreen({ route, navigation }) {
  const { media, index: initialIndex = 0 } = route.params;
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const post = media[currentIndex];

  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 150) {
          navigation.goBack();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[styles.content, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <Image source={{ uri: post.url }} style={styles.image} />
        {post.caption?.trim() && <Text style={styles.caption}>{post.caption}</Text>}
        {post.createdAt && (
          <Text style={styles.timestamp}>
            Posted on {new Date(post.createdAt).toLocaleString()}
          </Text>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  caption: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  timestamp: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
});
