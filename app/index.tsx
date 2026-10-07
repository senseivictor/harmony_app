import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { CustomModal } from "./src/components/CustomModal";
import { THEME } from "./src/constants";
import { SongEditor } from "./src/screens/SongEditor";
import { SongList } from "./src/screens/SongList";
import { Playlist, Song, ViewMode } from "./src/types";

function HarmonyApp() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewMode>("list");

  // Data State
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [currentSong, setCurrentSong] = useState<Song>({
    id: null,
    title: "",
    key: "C",
    content: "",
  });

  // Conflict / Modals
  const [conflicts, setConflicts] = useState<{ local: Song; incoming: Song }[]>(
    []
  );
  const [pendingImports, setPendingImports] = useState<Song[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedSongs = await AsyncStorage.getItem("harmony_songs");
      const storedPlaylists = await AsyncStorage.getItem("harmony_playlists");
      if (storedSongs) setSongs(JSON.parse(storedSongs));
      if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
    } catch (e) {
      console.error(e);
    }
  };

  const saveData = async (newSongs: Song[], newPlaylists?: Playlist[]) => {
    setSongs(newSongs);
    await AsyncStorage.setItem("harmony_songs", JSON.stringify(newSongs));
    if (newPlaylists) {
      setPlaylists(newPlaylists);
      await AsyncStorage.setItem(
        "harmony_playlists",
        JSON.stringify(newPlaylists)
      );
    }
  };

  const savePlaylistsOnly = async (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
    await AsyncStorage.setItem(
      "harmony_playlists",
      JSON.stringify(newPlaylists)
    );
  };

  // --- Song Handlers ---
  const handleSaveSong = async (songToSave: Song) => {
    const finalSong: Song = {
      ...songToSave,
      id: songToSave.id || Date.now().toString(),
      updatedAt: Date.now(),
    };

    let newSongs = [...songs];
    if (songToSave.id) {
      newSongs = newSongs.map((s) => (s.id === songToSave.id ? finalSong : s));
    } else {
      newSongs.unshift(finalSong);
    }
    await saveData(newSongs);
    setView("list");
  };

  const handleDeleteSongs = async () => {
    // Remove songs from Library
    const newSongs = songs.filter((s) => s.id && !deleteIds.includes(s.id));

    // Also remove these IDs from any playlists
    const newPlaylists = playlists.map((p) => ({
      ...p,
      songIds: p.songIds.filter((sid) => !deleteIds.includes(sid)),
    }));

    await saveData(newSongs, newPlaylists);
    setDeleteModalVisible(false);
    setDeleteIds([]);
  };

  // --- Playlist Handlers ---
  const handleCreatePlaylist = async (name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      title: name,
      songIds: [],
      createdAt: Date.now(),
    };
    await savePlaylistsOnly([newPlaylist, ...playlists]);
  };

  const handleDeletePlaylist = async (id: string) => {
    await savePlaylistsOnly(playlists.filter((p) => p.id !== id));
  };

  const handleAddSongsToPlaylist = async (
    playlistId: string,
    songIds: string[]
  ) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;

    // Avoid duplicates
    const uniqueIds = Array.from(new Set([...target.songIds, ...songIds]));

    const newPlaylists = playlists.map((p) =>
      p.id === playlistId ? { ...p, songIds: uniqueIds } : p
    );
    await savePlaylistsOnly(newPlaylists);
    Alert.alert("Success", "Songs added to playlist.");
  };

  const handleRemoveSongsFromPlaylist = async (
    playlistId: string,
    songIdsToRemove: string[]
  ) => {
    const newPlaylists = playlists.map((p) =>
      p.id === playlistId
        ? {
            ...p,
            songIds: p.songIds.filter((sid) => !songIdsToRemove.includes(sid)),
          }
        : p
    );
    await savePlaylistsOnly(newPlaylists);
  };

  // --- Export/Import ---
  const handleExport = async (ids: string[]) => {
    const toExport = songs.filter((s) => ids.includes(s.id!));
    if (toExport.length === 0) return;
    await Clipboard.setStringAsync(JSON.stringify(toExport));
    Alert.alert("Exported", `${toExport.length} song(s) copied to clipboard.`);
  };

  const handleImportInitiate = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const importedData = JSON.parse(text);
      if (!Array.isArray(importedData)) throw new Error();

      const newConflicts: { local: Song; incoming: Song }[] = [];
      const nonConflicting: Song[] = [];

      importedData.forEach((incoming: Song) => {
        const localMatch = songs.find((s) => s.id === incoming.id);
        if (
          localMatch &&
          (localMatch.content !== incoming.content ||
            localMatch.title !== incoming.title)
        ) {
          newConflicts.push({ local: localMatch, incoming });
        } else {
          nonConflicting.push(incoming);
        }
      });

      if (newConflicts.length > 0) {
        setConflicts(newConflicts);
        setPendingImports(nonConflicting);
        setConflictModalVisible(true);
      } else {
        finalizeImport(importedData);
      }
    } catch (e) {
      Alert.alert("Error", "Invalid import data.");
    }
  };

  const finalizeImport = async (songsToAdd: Song[]) => {
    const merged = [...songsToAdd, ...songs].filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );
    await saveData(merged);
    setImportModalVisible(false);
    setConflictModalVisible(false);
    Alert.alert("Success", "Songs imported successfully.");
  };

  const resolveConflicts = (overwrite: boolean) => {
    const resolvedConflicts = conflicts.map((c) =>
      overwrite ? c.incoming : c.local
    );
    finalizeImport([...pendingImports, ...resolvedConflicts]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Global Modals */}
      <CustomModal
        visible={deleteModalVisible}
        title="Delete Songs"
        message={`Are you sure you want to delete ${deleteIds.length} song(s)? This will remove them from all playlists.`}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteSongs}
        confirmText="Delete"
        confirmColor={THEME.danger}
      />
      <CustomModal
        visible={importModalVisible}
        title="Import Library"
        message="Merge songs from clipboard?"
        onCancel={() => setImportModalVisible(false)}
        onConfirm={handleImportInitiate}
        confirmText="Check & Import"
      />

      <Modal visible={conflictModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Conflicts Detected</Text>
            <ScrollView style={{ marginBottom: 20 }}>
              {conflicts.map((c, i) => (
                <View key={i} style={styles.conflictItem}>
                  <Text style={styles.conflictTitle}>
                    {c.local.title || "Untitled"}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setConflictModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => resolveConflicts(false)}
              >
                <Text style={styles.modalBtnText}>Keep Local</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnMain, { backgroundColor: THEME.danger }]}
                onPress={() => resolveConflicts(true)}
              >
                <Text style={styles.modalBtnMainText}>Overwrite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {view === "list" ? (
        <SongList
          songs={songs}
          playlists={playlists}
          onSelectSong={(song) => {
            setCurrentSong(song);
            setView("editor");
          }}
          onCreateSong={() => {
            setCurrentSong({ id: null, title: "", key: "C", content: "" });
            setView("editor");
          }}
          onDeleteSongs={(ids) => {
            setDeleteIds(ids);
            setDeleteModalVisible(true);
          }}
          onImport={() => setImportModalVisible(true)}
          onExport={handleExport}
          // Playlist Props
          onCreatePlaylist={handleCreatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onAddSongsToPlaylist={handleAddSongsToPlaylist}
          onRemoveSongsFromPlaylist={handleRemoveSongsFromPlaylist}
        />
      ) : (
        <SongEditor
          initialSong={currentSong}
          onSave={handleSaveSong}
          onBack={() => setView("list")}
          onDelete={(id) => {
            setDeleteIds([id]);
            handleDeleteSongs().then(() => setView("list"));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 25,
    width: "100%",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  conflictItem: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 10,
  },
  conflictTitle: { color: THEME.text, fontWeight: "bold", fontSize: 16 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBtn: { paddingHorizontal: 15, paddingVertical: 10, marginLeft: 10 },
  modalBtnText: { color: THEME.textDim, fontWeight: "700", fontSize: 15 },
  modalBtnMain: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },
  modalBtnMainText: { color: "#000", fontWeight: "800", fontSize: 15 },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <HarmonyApp />
    </SafeAreaProvider>
  );
}
