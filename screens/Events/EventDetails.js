import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, StyleSheet, Image } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Menu, Provider } from 'react-native-paper';
import { db } from '../../firebaseConfig';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, deleteDoc, getDoc, updateDoc, arrayUnion, collection, } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native'

export default function EventDetails({ route, navigation }) {
    const { user } = useContext(AuthContext);
    const initialEvent = route.params.event;
    const [event, setEvent] = useState(initialEvent);
    const isCreator = event.createdBy === user.uid;
    const [menuVisible, setMenuVisible] = useState(false);
    const [joining, setJoining] = useState(false);
    const [attendeeUsers, setAttendeeUsers] = useState([]);
    const [imageError, setImageError] = useState(false);
   
    useFocusEffect(
        React.useCallback(() => {
            const fetchEvent = async () => {
                const snap = await getDoc(doc(db, 'events', event.id));
                if (snap.exists()) setEvent({ id: event.id, ...snap.data() });
            };
            fetchEvent();
        }, [event.id])
    );

    useEffect(() => {
    const fetchAttendees = async () => {
        // Combine attendees and invitedUsers, remove duplicates
        const allIds = [
            ...(event.attendees || []),
            ...(event.invitedUsers || [])
        ];
        const uniqueIds = Array.from(new Set(allIds));
        if (uniqueIds.length === 0) {
            setAttendeeUsers([]);
            return;
        }
        try {
            const users = [];
            for (const uid of uniqueIds) {
                const userSnap = await getDoc(doc(db, 'users', uid));
                if (userSnap.exists()) {
                    users.push({ uid, ...userSnap.data() });
                }
            }
            setAttendeeUsers(users);
        } catch (e) {
            setAttendeeUsers([]);
        }
    };
    fetchAttendees();
}, [event.attendees, event.invitedUsers]);

    useEffect(() => {
        if (route.params?.event) {
            setEvent(route.params.event);
        }
    }, [route.params?.event]);

    const handleEdit = () => {
        setMenuVisible(false);
        navigation.navigate('CreateEvent', { event, isEdit: true });
    };

    const handleDelete = async () => {
        setMenuVisible(false);
        Alert.alert('Delete Event', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteDoc(doc(db, 'events', event.id));
                    Alert.alert('Deleted', 'Event deleted');
                    navigation.goBack();
                }
            }
        ]);
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            const eventRef = doc(db, 'events', event.id);
            await updateDoc(eventRef, {
                attendees: arrayUnion(user.uid)
            });
            // Refresh event data
            const snap = await getDoc(eventRef);
            if (snap.exists()) setEvent({ id: event.id, ...snap.data() });
            Alert.alert('Joined event!');
        } catch (e) {
            Alert.alert('Error', 'Could not join event.');
        } finally {
            setJoining(false);
        }
    };

    const alreadyJoined = (event.attendees || []).includes(user.uid);

    return (
        <Provider>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{event.title}</Text>
                        {isCreator && (
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                                        <Feather name="more-vertical" size={26} color="#333" />
                                    </TouchableOpacity>
                                }
                            >
                                <Menu.Item onPress={handleEdit} title="Edit" />
                                <Menu.Item onPress={handleDelete} title="Delete" />
                            </Menu>
                        )}
                    </View>
                    <Text style={styles.label}>Date & Time</Text>
                    <Text style={styles.value}>{event.date} at {event.time}</Text>
                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.value}>{event.location?.name || 'N/A'}</Text>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.value}>{event.description || 'No description provided.'}</Text>

                    {/* Join Button only if not creator and not already joined */}
                    {!isCreator && !alreadyJoined && !event.isChallenging && (
                        <TouchableOpacity
                            onPress={handleJoin}
                            style={styles.joinBtn}
                            disabled={joining}
                        >
                            <Text style={styles.joinText}>{joining ? 'Joining...' : 'Join Event'}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Attendees */}
                    <Text style={styles.label}>Attendees</Text>
                    <View style={styles.attendeeList}>
                        {attendeeUsers.length === 0 ? (
                            <Text style={styles.value}>No attendees yet.</Text>
                        ) : (
                            attendeeUsers.map(user => (
                                <View key={user.uid} style={styles.attendeeCard}>
                                    {user.avatar && !imageError && user.avatar.trim() !== "" ? (
                                        <Image source={{ uri: user.avatar }} style={styles.attendeeAvatar} onError={() => setImageError(true)} />
                                    ) : (
                                        <Ionicons name="person-circle-outline" size={36} color="#ccc" style={styles.attendeeAvatar} />
                                    )}
                                    <Text style={styles.attendeeName}>{user.fullName || 'User'}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </Provider>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { padding: 20 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FF822B', flex: 1 },
    label: { fontSize: 16, fontWeight: '600', color: '#444', marginTop: 16 },
    value: { fontSize: 15, color: '#333', marginTop: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 8,
        marginTop: 6,
    },
    editActions: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-around',
    },
    saveBtn: {
        backgroundColor: '#FF822B',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    btnText: { color: '#fff', fontWeight: 'bold' },
    joinBtn: {
        backgroundColor: '#FF822B',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
        alignSelf: 'center',
        elevation: 2,
    },
    joinText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    attendeeList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 12,
    },
    attendeeCard: {
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
        width: 70,
    },
    attendeeAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginBottom: 4,
    },
    attendeeName: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
    },
});
