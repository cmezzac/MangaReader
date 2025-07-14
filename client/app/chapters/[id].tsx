import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";

type Chapter = {
  id: string;
  chapter: string;
};

export default function ChaptersScreen() {
  const { id, title, mangaImage } = useLocalSearchParams<{
    id: string;
    title: string;
    mangaImage?: string;
  }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const res = await fetch(
          `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500`
        );
        const data = await res.json();

        const deduplicated = new Map<string, Chapter>();
        for (const item of data.data) {
          const chapterNum = item.attributes.chapter;
          if (!chapterNum) continue;
          deduplicated.set(chapterNum, {
            id: item.id,
            chapter: chapterNum,
          });
        }

        const processed = Array.from(deduplicated.values()).sort(
          (a, b) => parseFloat(a.chapter) - parseFloat(b.chapter)
        );

        setChapters(processed);
      } catch (err) {
        console.error("Failed to fetch chapters", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchChapters();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={styles.simpleHeader}>
          <Text style={styles.simpleHeaderText}>Chapters</Text>
        </View>

        {/* Chapter list */}
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.chapterItem}
              onPress={() =>
                router.push({
                  pathname: "/reader/[chapterId]",
                  params: {
                    chapterId: item.id,
                    all: JSON.stringify(chapters.map((c) => c.id)),
                    index: index.toString(),
                    mangaTitle: title,
                    mangaImage,
                  },
                })
              }
            >
              <Text style={styles.chapterText}>Chapter {item.chapter}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  simpleHeader: {
    padding: 15,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  simpleHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#222",
    alignItems: "center",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  chapterItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  chapterText: {
    fontSize: 16,
  },
});
