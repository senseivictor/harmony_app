import { Ionicons } from "@expo/vector-icons";

export interface Song {
  id: string | null;
  title: string;
  key: string;
  content: string;
  updatedAt?: number;
}

export interface Playlist {
  id: string;
  title: string;
  songIds: string[];
  createdAt: number;
}

export type ViewMode = "list" | "editor";
export type NotationMode = "numbers" | "chords";

export interface SymbolButton {
  label: string;
  val: string;
  type:
    | "number"
    | "chord"
    | "modifier"
    | "action"
    | "format"
    | "text"
    | "break"
    | "history"
    | "delete";
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}
