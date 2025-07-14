import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import PagerView from "react-native-pager-view";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recently_viewed_manga";

export default function Reader() {
  const { chapterId, all, index, mangaTitle, mangaImage } =
    useLocalSearchParams<{
      chapterId: string;
      all: string;
      index: string;
      mangaTitle?: string;
      mangaImage?: string;
    }>();

  const chapters: string[] = JSON.parse(all ?? "[]");
  const [chapterIndex, setChapterIndex] = useState(parseInt(index ?? "0", 10));
  const [preloadedChapters, setPreloadedChapters] = useState<
    Record<string, string[]>
  >({});
  const pagerRef = useRef<PagerView>(null);

  const preloadChapters = async (ids: string[], startIndex: number) => {
    const newPreloads: Record<string, string[]> = {};
    const preloadLimit = 5;

    for (let i = 0; i < preloadLimit; i++) {
      const idx = startIndex + i;
      if (idx >= ids.length) break;

      const id = ids[idx];
      if (preloadedChapters[id]) continue;

      try {
        const res = await fetch(
          `https://api.mangadex.org/at-home/server/${id}`
        );
        const data = await res.json();
        const { baseUrl, chapter } = data;
        const urls = chapter.data.map(
          (img: string) => `${baseUrl}/data/${chapter.hash}/${img}`
        );
        newPreloads[id] = urls;
      } catch (e) {
        console.warn(`Failed to preload chapter ${id}`, e);
      }
    }

    setPreloadedChapters((prev) => ({ ...prev, ...newPreloads }));
  };

  useEffect(() => {
    preloadChapters(chapters, chapterIndex);
    pagerRef.current?.setPage(0);

    // Update last read chapter info in AsyncStorage
    const updateLastRead = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];

        const existingIndex = list.findIndex(
          (m: any) => m.title === mangaTitle
        );

        const updatedManga = {
          id: mangaTitle, // ideally pass mangaId separately
          title: mangaTitle ?? "Unknown",
          image: mangaImage ?? "",
          chapterId: chapters[chapterIndex],
          chapterIndex,
          allChapters: chapters,
        };

        if (existingIndex !== -1) {
          list[existingIndex] = updatedManga;
        } else {
          list.unshift(updatedManga);
        }

        const limitedList = list.slice(0, 20);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(limitedList));
      } catch (e) {
        console.warn("Failed to update last read chapter", e);
      }
    };

    updateLastRead();
  }, [chapterIndex]);

  const onPageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    const currentPages = preloadedChapters[chapters[chapterIndex]];

    // Since first page is empty, adjust length & position accordingly:
    if (
      position === currentPages.length && // last page is now at length (not length -1)
      chapterIndex < chapters.length - 1
    ) {
      setTimeout(() => {
        setChapterIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const currentChapterId = chapters[chapterIndex];
  const pageUrls = preloadedChapters[currentChapterId] || [];

  if (!pageUrls.length) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with manga title and chapter */}
      <View style={styles.header}>
        <Text style={styles.title}>{mangaTitle ?? "Unknown Manga"}</Text>
        <Text style={styles.chapter}>Chapter {chapterIndex + 1}</Text>
      </View>

      {/* PagerView for manga pages */}
      <PagerView
        style={styles.pager}
        initialPage={1}
        onPageSelected={onPageSelected}
        ref={pagerRef}
      >
        {/* First empty page */}
        <View key={"empty"} style={styles.emptyPage} />

        {/* Pages with manga images */}
        {pageUrls.map((url, i) => (
          <View key={i}>
            <Image
              source={{ uri: url }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" }, // Transparent background
  header: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  chapter: {
    color: "lightgray",
    fontSize: 14,
    marginTop: 2,
  },
  pager: {
    flex: 1,
  },
  emptyPage: {
    flex: 1,
    backgroundColor: "transparent",
  },
  image: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height - 60, // leave space for header
  },
});
