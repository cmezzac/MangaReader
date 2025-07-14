import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert, // <-- import Alert here
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

const STORAGE_KEY = "recently_viewed_manga";

type ViewedManga = {
  title: string;
  image: string;
  chapterId: string;
  chapterIndex: number;
  allChapters: string[];
};

export default function ProfileScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<ViewedManga[]>([]);

  const router = useRouter();

  // Load recently viewed from AsyncStorage on mount
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    };
    loadRecentlyViewed();
  }, []);

  const handleLogin = () => {
    if (username && password) {
      setLoggedInUser(username);
    }
  };

  const goToChapter = (manga: ViewedManga) => {
    router.push({
      pathname: "/reader/[chapterId]",
      params: {
        chapterId: manga.chapterId,
        index: manga.chapterIndex.toString(),
        all: JSON.stringify(manga.allChapters),
      },
    });
  };

  // Clear cache with confirmation alert
  const clearCache = () => {
    Alert.alert(
      "Clear Cache",
      "If you delete all, your saved info will be lost. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setRecentlyViewed([]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loggedInUser ? (
        <>
          <Text style={styles.welcome}>Welcome, {loggedInUser}</Text>
          <Button title="Clear Cache" color="red" onPress={clearCache} />
          <Text style={styles.subheading}>Recently Viewed</Text>
          <FlatList
            data={recentlyViewed}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => goToChapter(item)}>
                <View style={styles.card}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <Text style={styles.title}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      ) : (
        <>
          <Text style={styles.heading}>Login</Text>
          <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Button title="Login" onPress={handleLogin} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  heading: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subheading: { fontSize: 16, marginTop: 30, marginBottom: 10 },
  welcome: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  card: {
    marginRight: 10,
    alignItems: "center",
    width: 100,
  },
  image: {
    width: 100,
    height: 150,
    borderRadius: 6,
  },
  title: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 12,
  },
});
