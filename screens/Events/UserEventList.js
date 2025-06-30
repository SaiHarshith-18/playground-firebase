import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Linking,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import { Menu, Provider as PaperProvider, List } from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { AuthContext } from "../../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { EventCard } from "./EventCard";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { doc, deleteDoc } from "firebase/firestore";
import { parseEventDateTime } from "../../utils/Date.js";
import { getDistance, openMap } from "../../utils/Location";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function UserEventList() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [exploreEvents, setExploreEvents] = useState([]);
  const [explorePage, setExplorePage] = useState(1);
  const EVENTS_PER_PAGE = 10;
  const [sortBy, setSortBy] = useState("dateAsc");
  const [filters, setFilters] = useState({
    distance: null,
    gameType: null,
    timeRange: null,
    role: "all",
    status: "upcoming",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    if (filters.distance) fetchLocationAndFilter();
  }, [filters.distance]);

  useEffect(() => {
    if (events.length > 0) {
      const filtered = filterEvents(events);
      const sorted = sortEvents(filtered);

      const mine = sorted.filter(
        (event) =>
          event.createdBy === user.uid ||
          (event.attendees || []).includes(user.uid)
      );
      const explore = sorted.filter(
        (event) =>
          event.createdBy !== user.uid &&
          !(event.attendees || []).includes(user.uid)
      );

      setMyEvents(mine);
      setExploreEvents(explore);
      setExplorePage(1);
    }
  }, [events, filters, sortBy, searchQuery]);

  const paginatedExploreEvents = exploreEvents.slice(
    0,
    explorePage * EVENTS_PER_PAGE
  );

  const handleLoadMore = () => {
    if (paginatedExploreEvents.length < exploreEvents.length) {
      setExplorePage((page) => page + 1);
    }
  };

  const handleEditEvent = (event) => {
    navigation.navigate("CreateEvent", { event, isEdit: true });
  };

  const handleDeleteEvent = async (event) => {
    try {
      await deleteDoc(doc(db, "events", event.id));
      // Remove deleted event from state
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const sortEvents = (data) => {
    return [...data].sort((a, b) => {
      const dtA = parseEventDateTime(a.date, a.time);
      const dtB = parseEventDateTime(b.date, b.time);
      switch (sortBy) {
        case "dateAsc":
          return dtA - dtB;
        case "dateDesc":
          return dtB - dtA;
        case "gameType":
          return a.gametype?.localeCompare(b.gametype);
        case "location":
          return a.location.name.localeCompare(b.location.name);
        case "timeOfDay":
          return dtA.getHours() - dtB.getHours();
        default:
          return dtA - dtB;
      }
    });
  };

  const handleSortChange = (type) => {
    setSortBy((prev) => (prev === type ? "dateAsc" : type));
    setSortMenuVisible(false);
  };

  const filterEvents = (data) => {
    const now = new Date();
    return data.filter((event) => {
      const dt = parseEventDateTime(event.date, event.time);
      const distance = userLocation
        ? getDistance(
            userLocation.latitude,
            userLocation.longitude,
            event.location.latitude,
            event.location.longitude
          )
        : null;
      if (
        searchQuery &&
        !(
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
        return false;
      if (filters.distance && distance !== null && distance > filters.distance)
        return false;
      if (
        filters.gameType &&
        event.gametype?.toLowerCase() !== filters.gameType.toLowerCase()
      )
        return false;
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const dtStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const dayDiff = Math.floor(
        (dtStart - startOfToday) / (1000 * 60 * 60 * 24)
      );
      if (
        filters.timeRange === "today" &&
        dt.toDateString() !== now.toDateString()
      )
        return false;
      if (filters.timeRange === "week" && (dayDiff < 0 || dayDiff > 7))
        return false;
      if (
        filters.timeRange === "month" &&
        (dt.getMonth() !== now.getMonth() ||
          dt.getFullYear() !== now.getFullYear())
      )
        return false;
      if (filters.status === "upcoming" && dt < now) return false;
      if (filters.status === "past" && dt >= now) return false;
      if (filters.role === "creator" && event.createdBy !== user.uid)
        return false;
      if (
        filters.role === "attendee" &&
        !(event.attendees || []).includes(user.uid)
      )
        return false;
      return true;
    });
  };

  const applyFiltersAndSort = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let result = filterEvents(events);
    result = sortEvents(result);
    setFilteredEvents(result);
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, "events"));
      const snapshot = await getDocs(q);
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationAndFilter = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const location = await Location.getCurrentPositionAsync({});
    setUserLocation(location.coords);
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      fetchLocationAndFilter();
    }, [])
  );
  useEffect(() => {
    if (events.length > 0) applyFiltersAndSort();
  }, [events, filters, sortBy, searchQuery]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <PaperProvider>
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.iconBar}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search by title, description, or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={{ x: 30, y: 70 }}
            contentStyle={{ backgroundColor: "#FFE5D1" }}
          >
            {[
              { key: "dateAsc", label: "Date Ascending" },
              { key: "dateDesc", label: "Date Descending" },
              { key: "gameType", label: "Game Type" },
              { key: "location", label: "Location" },
              { key: "timeOfDay", label: "Time of Day" },
            ].map(({ key, label }) => (
              <Menu.Item
                key={key}
                onPress={() => {
                  setSortBy((prev) => (prev === key ? "dateAsc" : key));
                  setSortMenuVisible(false);
                }}
                title={label}
                style={sortBy === key ? { backgroundColor: "#FF822B" } : null}
                titleStyle={
                  sortBy === key
                    ? { color: "#fff", fontWeight: "bold" }
                    : { fontWeight: "normal" }
                }
                right={() =>
                  sortBy === key ? (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  ) : null
                }
              />
            ))}
          </Menu>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={{ x: 100, y: 70 }}
            contentStyle={{ backgroundColor: "#FFE5D1" }}
          >
            {/* Distance Filters */}
            <List.Item
              onPress={() => {
                const newDistance = filters.distance === 2 ? null : 2;
                setFilters((prev) => ({ ...prev, distance: newDistance }));
                setFilterMenuVisible(false);
              }}
              title="Within 2 miles"
              style={
                filters.distance === 2 ? { backgroundColor: "#FF822B" } : null
              }
              titleStyle={
                filters.distance === 2
                  ? { color: "#fff", fontWeight: "bold" }
                  : null
              }
            />
            <List.Item
              onPress={() => {
                const newDistance = filters.distance === 5 ? null : 5;
                setFilters((prev) => ({ ...prev, distance: newDistance }));
                setFilterMenuVisible(false);
              }}
              title="Within 5 miles"
              style={
                filters.distance === 5 ? { backgroundColor: "#FF822B" } : null
              }
              titleStyle={
                filters.distance === 5
                  ? { color: "#FFF", fontWeight: "bold" }
                  : null
              }
            />

            {/* Time Range Filters */}
            {["today", "week", "month"].map((range) => (
              <List.Item
                key={range}
                onPress={() => {
                  const newTime = filters.timeRange === range ? null : range;
                  setFilters((prev) => ({ ...prev, timeRange: newTime }));
                  setFilterMenuVisible(false);
                }}
                title={
                  range === "today"
                    ? "Today"
                    : range === "week"
                    ? "This Week"
                    : "This Month"
                }
                style={
                  filters.timeRange === range
                    ? { backgroundColor: "#FF822B" }
                    : null
                }
                titleStyle={
                  filters.timeRange === range
                    ? { color: "#FFF", fontWeight: "bold" }
                    : null
                }
              />
            ))}

            {/* Role Filter */}
            {["creator", "attendee"].map((role) => (
              <List.Item
                key={role}
                onPress={() => {
                  const newRole = filters.role === role ? "all" : role;
                  setFilters((prev) => ({ ...prev, role: newRole }));
                  setFilterMenuVisible(false);
                }}
                title={
                  role === "creator"
                    ? "My Created Events"
                    : "Events I'm Attending"
                }
                style={
                  filters.role === role ? { backgroundColor: "#FF822B" } : null
                }
                titleStyle={
                  filters.role === role
                    ? { color: "#FFF", fontWeight: "bold" }
                    : null
                }
              />
            ))}

            {/* Status Filter */}
            {["upcoming", "past"].map((status) => (
              <List.Item
                key={status}
                onPress={() => {
                  const newStatus = filters.status === status ? null : status;
                  setFilters((prev) => ({ ...prev, status: newStatus }));
                  setFilterMenuVisible(false);
                }}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
                style={
                  filters.status === status
                    ? { backgroundColor: "#FF822B" }
                    : null
                }
                titleStyle={
                  filters.status === status
                    ? { color: "#FFF", fontWeight: "bold" }
                    : null
                }
              />
            ))}
            <List.Item
              onPress={() => {
                setFilters({
                  distance: null,
                  gameType: null,
                  timeRange: null,
                  role: "all",
                  status: "upcoming",
                });
                setFilterMenuVisible(false);
                setTimeout(applyFiltersAndSort, 0);
              }}
              title="Clear All Filters"
              right={() => (
                <Ionicons name="close-circle" size={18} color="#FF822B" />
              )}
            />
          </Menu>
          <TouchableOpacity
            onPress={() => setSortMenuVisible(true)}
            style={styles.iconBtn}
          >
            <Ionicons name="swap-vertical" size={24} color="#FF822B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterMenuVisible(true)}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color="#FF822B"
            />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>My Events</Text>
          {myEvents.length === 0 ? (
            <View style={styles.emptyUserEvents}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color="#FF822B"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.emptyText}>
                You haven't joined or created any events yet.
              </Text>
              <TouchableOpacity
                style={styles.createEventBtn}
                onPress={() => navigation.navigate("CreateEvent")}
              >
                <Text style={styles.createEventBtnText}>+ Create Event</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myEvents.map((event) => (
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
                    onDelete: () => {
                      fetchEvents();
                    },
                  })
                }
              />
            ))
          )}
          <Text style={styles.sectionTitle}>Explore Events</Text>
          {paginatedExploreEvents.length === 0 ? (
            <Text style={styles.emptyText}>
              No events found. Try adjusting your filters or search.
            </Text>
          ) : (
            paginatedExploreEvents.map((event) => (
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
                    onDelete: fetchEvents,
                  })
                }
              />
            ))
          )}
          {paginatedExploreEvents.length < exploreEvents.length && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
            >
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    flex: 1,
    paddingHorizontal: 0,
  },
  searchBar: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  iconBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginRight: 16,
    marginLeft: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  day: { fontSize: 18, fontWeight: "bold", color: "#FF822B" },
  month: { fontSize: 12, color: "#888", marginTop: -2 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 16,
  },
  emptyUserEvents: {
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
  },
  createEventBtn: {
    backgroundColor: "#FF822B",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  createEventBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadMoreBtn: {
    backgroundColor: "#FFE5D1",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignSelf: "center",
    marginVertical: 12,
  },
  loadMoreText: {
    color: "#FF822B",
    fontWeight: "bold",
    fontSize: 16,
  },
});
