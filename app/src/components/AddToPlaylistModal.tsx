import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../constants";
import { Playlist } from "../types";

interface AddToPlaylistModalProps {
  visible: boolean;
  playlists: Playlist[];
  onSelect: (playlistId: string) => void;
  onCancel: () => void;
}

export const AddToPlaylistModal = ({
  visible,
  playlists,
  onSelect,
  onCancel,
}: AddToPlaylistModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Add to Playlist</Text>
          {playlists.length === 0 ? (
            <Text style={styles.emptyText}>No playlists created yet.</Text>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => onSelect(item.id)}
                >
                  <Text style={styles.itemText}>{item.title}</Text>
                  <Text style={styles.countText}>
                    {item.songIds.length} songs
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyText: {
    color: THEME.textDim,
    textAlign: "center",
    marginBottom: 20,
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemText: { color: THEME.text, fontSize: 18, fontWeight: "600" },
  countText: { color: THEME.textDim, fontSize: 14 },
  closeBtn: { marginTop: 20, alignItems: "center", padding: 10 },
  closeText: { color: THEME.textDim, fontSize: 16, fontWeight: "bold" },
});
