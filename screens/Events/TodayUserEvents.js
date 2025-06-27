import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from "react-native";
import { db } from "../../firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "../../contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { parseEventDateTime } from "../../utils/Date";
import { EventCard } from "./EventCard";

export default function TodayUserEvents({ navigation }) {
  const { user } = useContext(AuthContext);
  const [todayEvents, setTodayEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const handleEditEvent = (event) => {
    navigation.navigate("CreateEvent", { event, isEdit: true });
  };

  const handleDeleteEvent = async (event) => {
    await deleteDoc(doc(db, "events", event.id));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const now = new Date();
        const today = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((event) => {
            const dt = parseEventDateTime(event.date, event.time);
            return (
              dt.toDateString() === now.toDateString() &&
              (event.createdBy === user.uid ||
                (event.attendees || []).includes(user.uid))
            );
          });
        setTodayEvents(today);
      } catch (e) {
        console.error("Error loading events:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const openMap = (location) => {
    const lat = location.latitude;
    const lng = location.longitude;
    const label = location.name;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    Linking.openURL(url);
  };

  if (loading)
    return <ActivityIndicator size="small" style={{ marginTop: 10 }} />;

  if (todayEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../../assets/playing-football.png")}
          style={{ width: 90, height: 90, marginBottom: 10 }}
          resizeMode="contain"
        />
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>
            Oops! No events on the board. Time to make your move!
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("CreateEvent")}>
            <Text style={styles.createEventLink}>Create Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.eventsContainer}>
      {todayEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          userId={user.uid}
          onLocationPress={openMap}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onViewDetails={(selectedEvent) =>
            navigation.navigate("EventDetails", {
              event: selectedEvent,
              userId: user.uid,
            })
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  eventsContainer: { marginTop: 8, marginBottom: 16 },
  emptyContainer: {
    marginVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 2,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 6,
    marginRight: 6,
  },
  createEventLink: {
    color: "#FF822B",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
});
