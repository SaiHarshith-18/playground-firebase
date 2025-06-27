import React, { useState } from 'react';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function UserAvatar({ avatar, size = 36, style = {} }) {
  const [imgError, setImgError] = useState(false);

  if (avatar && !imgError && avatar.trim() !== "") {
    return (
      <Image
        source={{ uri: avatar }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <Ionicons
      name="person-circle-outline"
      size={size}
      color="#ccc"
      style={style}
    />
  );
}