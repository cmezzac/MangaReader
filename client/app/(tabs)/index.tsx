import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recently_viewed_manga";

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();

  // Save manga info locally on click
  const addToRecentlyViewed = async (manga: any) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const currentList = stored ? JSON.parse(stored) : [];

      // Remove any manga with the same title (case-insensitive)
      const filtered = currentList.filter(
        (m: any) => m.title.toLowerCase() !== manga.title.toLowerCase()
      );

      // Add the new manga at the front
      const newList = [manga, ...filtered];

      // Optional: limit stored list size (e.g., last 20)
      const limitedList = newList.slice(0, 20);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitedList));
    } catch (e) {
      console.warn("Failed to save recently viewed manga", e);
    }
  };

  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      return;
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.data);
      } catch (e) {
        console.error("Failed to search manga", e);
      }
    }, 500);

    setTypingTimeout(timeout);
  }, [query]);

  return (
    <View style={{ padding: 20, marginTop: 40 }}>
      <TextInput
        placeholder="Search manga..."
        value={query}
        onChangeText={setQuery}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const title = item.attributes.title?.en || "No Title";
          const mangaImage =
            item.attributes?.coverImage?.original ||
            item.attributes?.coverImage?.["512"] || // fallback sizes
            "";

          return (
            <TouchableOpacity
              onPress={async () => {
                await addToRecentlyViewed({
                  id: item.id,
                  title,
                  image: mangaImage,
                  chapterId: "", // will update when reading
                  chapterIndex: 0,
                  allChapters: [],
                });

                router.push({
                  pathname: "/chapters/[id]",
                  params: {
                    id: item.id,
                    title,
                    mangaImage,
                  },
                });
              }}
            >
              <Text style={{ marginVertical: 10 }}>{title}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
