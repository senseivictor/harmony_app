import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AddToPlaylistModal } from "../components/AddToPlaylistModal";
import { CustomModal } from "../components/CustomModal";
import { InputModal } from "../components/InputModal";
import { THEME } from "../constants";
import { Playlist, Song } from "../types";

interface SongListProps {
  songs: Song[];
  playlists: Playlist[];
  onSelectSong: (song: Song) => void;
  onCreateSong: () => void;
  onDeleteSongs: (ids: string[]) => void;
  onImport: () => void;
  onExport: (ids: string[]) => void;

  // Playlist Actions
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onAddSongsToPlaylist: (playlistId: string, songIds: string[]) => void;
  onRemoveSongsFromPlaylist: (playlistId: string, songIds: string[]) => void;
}

type Tab = "songs" | "playlists";

export const SongList = ({
  songs,
  playlists,
  onSelectSong,
  onCreateSong,
  onDeleteSongs,
  onImport,
  onExport,
  onCreatePlaylist,
  onDeletePlaylist,
  onAddSongsToPlaylist,
  onRemoveSongsFromPlaylist,
}: SongListProps) => {
  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<Tab>("songs");
  const [openedPlaylistId, setOpenedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection & Modal State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createPlaylistVisible, setCreatePlaylistVisible] = useState(false);
  const [addToPlaylistVisible, setAddToPlaylistVisible] = useState(false);

  // Local state for deleting a playlist (confirmation)
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  // --- Derived Data ---
  const filteredSongs = useMemo(() => {
    let baseList = songs;

    // If inside a playlist, filter only those songs
    if (activeTab === "playlists" && openedPlaylistId) {
      const playlist = playlists.find((p) => p.id === openedPlaylistId);
      if (playlist) {
        baseList = songs.filter((s) => s.id && playlist.songIds.includes(s.id));
      } else {
        baseList = [];
      }
    }

    // Apply Search
    if (!searchQuery) return baseList;
    return baseList.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, playlists, activeTab, openedPlaylistId, searchQuery]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery) return playlists;
    return playlists.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playlists, searchQuery]);

  // --- Handlers ---

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSongs.length) setSelectedIds([]);
    else setSelectedIds(filteredSongs.map((s) => s.id!));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleCardPress = (item: Song) => {
    if (selectionMode && item.id) {
      const isSelected = selectedIds.includes(item.id);
      isSelected
        ? setSelectedIds(selectedIds.filter((id) => id !== item.id))
        : setSelectedIds([...selectedIds, item.id]);
    } else {
      onSelectSong(item);
    }
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    setOpenedPlaylistId(playlist.id);
    setSearchQuery(""); // Reset search when entering playlist
  };

  // --- Render Sections ---

  const renderHeader = () => (
    <View>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Harmony</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={onImport} style={{ marginRight: 15 }}>
            <Ionicons name="download-outline" size={24} color={THEME.textDim} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={
              activeTab === "songs"
                ? onCreateSong
                : () => setCreatePlaylistVisible(true)
            }
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={THEME.textDim}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={THEME.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={THEME.textDim} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "songs" && styles.tabActive]}
          onPress={() => {
            setActiveTab("songs");
            setOpenedPlaylistId(null);
            setSearchQuery("");
            exitSelection();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "songs" && styles.tabTextActive,
            ]}
          >
            Songs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "playlists" && styles.tabActive]}
          onPress={() => {
            setActiveTab("playlists");
            setOpenedPlaylistId(null);
            setSearchQuery("");
            exitSelection();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "playlists" && styles.tabTextActive,
            ]}
          >
            Playlists
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelectionHeader = () => (
    <View style={styles.selectionHeaderContainer}>
      <View style={styles.selectionHeader}>
        <TouchableOpacity onPress={exitSelection}>
          <Ionicons name="close" size={24} color={THEME.text} />
        </TouchableOpacity>
        <Text style={styles.selectionCount}>{selectedIds.length} Selected</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleSelectAll} style={{ marginRight: 20 }}>
          <Text style={styles.selectBtnText}>
            {selectedIds.length === filteredSongs.length
              ? "Deselect All"
              : "Select All"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection Toolbar */}
      <View style={styles.selectionToolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => {
            onExport(selectedIds);
            exitSelection();
          }}
        >
          <Ionicons name="share-outline" size={24} color={THEME.primary} />
          <Text style={styles.toolLabel}>Export</Text>
        </TouchableOpacity>

        {/* Logic: If in All Songs -> Add to Playlist. If in Playlist -> Remove from Playlist */}
        {activeTab === "songs" || !openedPlaylistId ? (
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setAddToPlaylistVisible(true)}
          >
            <Ionicons name="albums-outline" size={24} color={THEME.accent} />
            <Text style={styles.toolLabel}>Add to PL</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => {
              onRemoveSongsFromPlaylist(openedPlaylistId, selectedIds);
              exitSelection();
            }}
          >
            <Ionicons
              name="remove-circle-outline"
              size={24}
              color={THEME.danger}
            />
            <Text style={styles.toolLabel}>Remove</Text>
          </TouchableOpacity>
        )}

        {/* Only allow permanent delete from All Songs view */}
        {activeTab === "songs" && (
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => onDeleteSongs(selectedIds)}
          >
            <Ionicons name="trash-outline" size={24} color={THEME.danger} />
            <Text style={styles.toolLabel}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // --- Main View Logic ---

  if (activeTab === "playlists" && !openedPlaylistId) {
    // 1. Playlists List View
    return (
      <View style={styles.container}>
        {renderHeader()}
        <InputModal
          visible={createPlaylistVisible}
          title="New Playlist"
          placeholder="Playlist Name"
          confirmText="Create"
          onCancel={() => setCreatePlaylistVisible(false)}
          onConfirm={(name) => {
            onCreatePlaylist(name);
            setCreatePlaylistVisible(false);
          }}
        />
        <CustomModal
          visible={!!playlistToDelete}
          title="Delete Playlist"
          message="Are you sure? Songs inside will not be deleted."
          confirmText="Delete"
          confirmColor={THEME.danger}
          onCancel={() => setPlaylistToDelete(null)}
          onConfirm={() => {
            if (playlistToDelete) onDeletePlaylist(playlistToDelete);
            setPlaylistToDelete(null);
          }}
        />

        <FlatList
          data={filteredPlaylists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            <Text style={styles.emptyState}>No playlists found.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playlistCard}
              onPress={() => handlePlaylistPress(item)}
              onLongPress={() => setPlaylistToDelete(item.id)}
            >
              <View style={styles.playlistIcon}>
                <Ionicons
                  name="musical-notes"
                  size={24}
                  color={THEME.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.songTitle}>{item.title}</Text>
                <Text style={styles.songKey}>{item.songIds.length} Songs</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={THEME.textDim}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // 2. Song List View (All Songs OR Inside a Playlist)
  const currentPlaylistTitle = openedPlaylistId
    ? playlists.find((p) => p.id === openedPlaylistId)?.title
    : null;

  return (
    <View style={styles.container}>
      {/* Modals */}
      <AddToPlaylistModal
        visible={addToPlaylistVisible}
        playlists={playlists}
        onCancel={() => setAddToPlaylistVisible(false)}
        onSelect={(pid) => {
          onAddSongsToPlaylist(pid, selectedIds);
          setAddToPlaylistVisible(false);
          exitSelection();
        }}
      />

      {selectionMode ? (
        renderSelectionHeader()
      ) : openedPlaylistId ? (
        // Header inside a playlist
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setOpenedPlaylistId(null)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
            <Text
              style={[styles.headerTitle, { fontSize: 24, marginLeft: 10 }]}
            >
              {currentPlaylistTitle}
            </Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={THEME.textDim}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in playlist..."
              placeholderTextColor={THEME.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      ) : (
        // Standard Header
        renderHeader()
      )}

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyState}>No songs found.</Text>
        }
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id!);
          return (
            <TouchableOpacity
              style={[styles.songCard, isSelected && styles.songCardSelected]}
              onLongPress={() => {
                setSelectionMode(true);
                if (item.id && !selectedIds.includes(item.id))
                  setSelectedIds([...selectedIds, item.id]);
              }}
              onPress={() => handleCardPress(item)}
            >
              <View>
                <Text style={styles.songTitle}>{item.title || "Untitled"}</Text>
                <Text style={styles.songKey}>Key: {item.key}</Text>
              </View>
              {selectionMode ? (
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={24}
                  color={isSelected ? THEME.primary : THEME.textDim}
                />
              ) : (
                <Ionicons
                  name="play-circle-outline"
                  size={24}
                  color={THEME.textDim}
                />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", color: THEME.text },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  addButton: {
    backgroundColor: THEME.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.card,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchInput: { flex: 1, color: THEME.text, fontSize: 16 },

  // Tabs
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tab: { marginRight: 25, paddingBottom: 10 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: THEME.primary },
  tabText: { color: THEME.textDim, fontSize: 16, fontWeight: "700" },
  tabTextActive: { color: THEME.text },

  // Selection
  selectionHeaderContainer: {
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 10,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  selectionCount: {
    color: THEME.text,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: "600",
  },
  selectBtnText: { color: THEME.primary, fontWeight: "bold" },
  selectionToolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 5,
  },
  toolBtn: { alignItems: "center" },
  toolLabel: { color: THEME.textDim, fontSize: 12, marginTop: 4 },

  // Lists
  songCard: {
    backgroundColor: THEME.card,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  playlistCard: {
    backgroundColor: THEME.card,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  songCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: THEME.selected,
  },
  songTitle: { color: THEME.text, fontSize: 17, fontWeight: "700" },
  songKey: {
    color: THEME.primary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  playlistIcon: {
    width: 45,
    height: 45,
    borderRadius: 8,
    backgroundColor: THEME.bg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  emptyState: {
    textAlign: "center",
    marginTop: 40,
    color: THEME.textDim,
    fontSize: 16,
  },
});
