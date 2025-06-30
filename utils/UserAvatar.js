import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function UserAvatar({ avatar, size = 90, style = {} }) {
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={[
        styles.avatarWrapper,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {avatar && !imgError && avatar.trim() !== "" ? (
        <Image
          source={{ uri: avatar }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#f3f3f3',
          }}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f3f3',
          }}
        >
          <Ionicons
            name="person-circle-outline"
            size={size * 0.85}
            color="#ccc"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});