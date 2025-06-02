import React, { useContext, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

export default function AllMediaScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [media, setMedia] = useState([]);

    useFocusEffect(
        useCallback(() => {
            const fetchMedia = async () => {
                if (!user?.uid) return;
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    const sortedMedia = (data.media || []).sort((a, b) => b.createdAt - a.createdAt);
                    setMedia(sortedMedia);
                }
            };
            fetchMedia();
        }, [user])
    );

      const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Image source={{ uri: item.url }} style={styles.image} />
            <TouchableOpacity
                style={styles.threeDots}
                onPress={() =>
                    navigation.navigate('PostDetail', { post: item })
                }
            >
                <Feather name="more-vertical" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    return (
         <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>All Media</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={26} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={media.filter(item => item.id !== 'add')}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50, paddingHorizontal: 15, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    title: { fontSize: 18, fontWeight: 'bold' },
    grid: { gap: 6 },
    itemContainer: {
        width: '48%',
        marginBottom: 12,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    image: { width: '100%', height: 150, borderRadius: 10 },
    overlayIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 4,
    },
    threeDots: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 2,
    },
});
