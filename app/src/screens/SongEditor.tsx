import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomModal } from "../components/CustomModal";
import {
  DISTANCE_TO_DEGREE,
  KEY_MAP,
  KEYS,
  normalizeNote,
  THEME,
} from "../constants";
import { NotationMode, Song, SymbolButton } from "../types";

interface SongEditorProps {
  initialSong: Song;
  onSave: (song: Song) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export const SongEditor = ({
  initialSong,
  onSave,
  onBack,
  onDelete,
}: SongEditorProps) => {
  const [currentSong, setCurrentSong] = useState<Song>(initialSong);
  const [isEditing, setIsEditing] = useState(false);
  const [notation, setNotation] = useState<NotationMode>("numbers");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [useSystemKeyboard, setUseSystemKeyboard] = useState(false);
  const [cursorPos, setCursorPos] = useState({ start: 0, end: 0 });

  // History
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Modals
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // --- Logic ---
  const handleBackPress = () => {
    if (hasUnsavedChanges) setExitModalVisible(true);
    else onBack();
  };

  const pushToHistory = () => {
    setHistory((prev) => [...prev, currentSong.content]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, currentSong.content]);
    setHistory((prev) => prev.slice(0, -1));
    setCurrentSong((curr) => ({ ...curr, content: previous }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, currentSong.content]);
    setRedoStack((prev) => prev.slice(0, -1));
    setCurrentSong((curr) => ({ ...curr, content: next }));
  };

  const renderStyledContent = (text: string) => {
    const chromatic = KEY_MAP[currentSong.key] || KEY_MAP["C"];
    const tokens = text.split(/(\s+|\||%|\/\/)/g);
    return tokens.map((token, i) => {
      if (!token || /^\s+$/.test(token) || ["|", "%", "//"].includes(token))
        return <Text key={i}>{token}</Text>;

      const match = token.match(/^([b#]?[1-7][b#]*)(.*)/);
      if (match) {
        let rootPart = match[1];
        const modifierPart = match[2];

        if (notation === "chords") {
          const degMatch = rootPart.match(/([b#]?)([1-7])([b#]*)/);
          if (degMatch) {
            const preAccidental = degMatch[1];
            const degreeNum = degMatch[2];
            const postAccidentals = degMatch[3];
            const degree = parseInt(degreeNum);
            const baseIdx = [0, 2, 4, 5, 7, 9, 11][degree - 1];
            let offset = 0;
            if (preAccidental === "b") offset -= 1;
            if (preAccidental === "#") offset += 1;
            for (let char of postAccidentals) {
              if (char === "b") offset -= 1;
              if (char === "#") offset += 1;
            }
            let finalIdx = (baseIdx + offset) % 12;
            if (finalIdx < 0) finalIdx += 12;
            const rootNote = normalizeNote(chromatic[finalIdx]);
            return (
              <Text key={i}>
                <Text style={styles.rootText}>{rootNote}</Text>
                <Text style={styles.modifierText}>{modifierPart}</Text>
              </Text>
            );
          }
        } else {
          return (
            <Text key={i}>
              <Text style={styles.rootText}>{rootPart}</Text>
              <Text style={styles.modifierText}>{modifierPart}</Text>
            </Text>
          );
        }
      }
      return <Text key={i}>{token}</Text>;
    });
  };

  const handleCustomInput = (item: SymbolButton) => {
    if (!isEditing) return;
    if (item.type === "text") {
      inputRef.current?.blur();
      setUseSystemKeyboard(true);
      setTimeout(() => inputRef.current?.focus(), 150);
      return;
    }
    pushToHistory();
    setHasUnsavedChanges(true);
    const { content } = currentSong;
    let head = content.substring(0, cursorPos.start);
    let tail = content.substring(cursorPos.end);
    let newText = "";
    let cursorOffset = 0;

    if (item.type === "action" && item.val === "BACKSPACE") {
      if (head.length > 0) {
        if (head.endsWith(" ")) {
          const parts = head.trimEnd().split(" ");
          const lastToken = parts[parts.length - 1];
          newText =
            head.substring(0, head.length - (lastToken.length + 1)) + tail;
          cursorOffset = -(lastToken.length + 1);
        } else {
          newText = head.substring(0, head.length - 1) + tail;
          cursorOffset = -1;
        }
      } else return;
    } else if (item.val === "\n") {
      newText = head + "\n" + tail;
      cursorOffset = 1;
    } else if (item.val === " ") {
      // Manual Space Logic
      newText = head + " " + tail;
      cursorOffset = 1;
    } else if (item.type === "modifier") {
      if (head.endsWith(" ")) {
        const headWithoutSpace = head.slice(0, -1);
        const toInsert = item.val + " ";
        newText = headWithoutSpace + toInsert + tail;
        cursorOffset = toInsert.length - 1;
      } else {
        const toInsert = item.val + " ";
        newText = head + toInsert + tail;
        cursorOffset = toInsert.length;
      }
    } else {
      const toInsert = item.val + " ";
      newText = head + toInsert + tail;
      cursorOffset = toInsert.length;
    }
    setCurrentSong({ ...currentSong, content: newText });
    const newPos = Math.max(0, cursorPos.start + cursorOffset);
    setCursorPos({ start: newPos, end: newPos });
  };

  const calculateDegreeValue = (chordLabel: string) => {
    const root = currentSong.key.replace("m", "");
    const getChromIdx = (note: string) => {
      const map: Record<string, number> = {
        C: 0,
        "C#": 1,
        Db: 1,
        D: 2,
        "D#": 3,
        Eb: 3,
        E: 4,
        F: 5,
        "F#": 6,
        Gb: 6,
        G: 7,
        "G#": 8,
        Ab: 8,
        A: 9,
        "A#": 10,
        Bb: 10,
        B: 11,
      };
      return map[note] ?? 0;
    };
    const targetIdx = getChromIdx(chordLabel);
    const currentRootIdx = getChromIdx(root);
    let diff = targetIdx - currentRootIdx;
    if (diff < 0) diff += 12;
    return DISTANCE_TO_DEGREE[diff] || "1";
  };

  const rowNumbers: SymbolButton[] = Array.from({ length: 7 }, (_, i) => ({
    label: (i + 1).toString(),
    val: (i + 1).toString(),
    type: "number",
  }));
  const rowChords: SymbolButton[] = ["C", "D", "E", "F", "G", "A", "B"].map(
    (chord) => ({
      label: chord,
      val: calculateDegreeValue(chord),
      type: "chord",
    })
  );
  const rowTypes: SymbolButton[] = [
    { label: "b", val: "b", type: "modifier" },
    { label: "#", val: "#", type: "modifier" },
    { label: "m", val: "m", type: "modifier" },
    { label: "maj7", val: "maj7", type: "modifier" },
    { label: "7", val: "7", type: "modifier" },
    { label: "sus", val: "sus", type: "modifier" },
    { label: "dim", val: "dim", type: "modifier" },
    { label: "ø", val: "ø", type: "modifier" },
    { label: "add9", val: "add9", type: "modifier" },
    { label: "6", val: "6", type: "modifier" },
  ];
  const rowFormatting: SymbolButton[] = [
    { label: "|", val: "|", type: "format" },
    { label: "%", val: "%", type: "format" },
    { label: "//", val: "//", type: "break" },
    { label: "Space", val: " ", type: "format" }, // Added Manual Space
    { label: "T", val: "TEXT", type: "text", color: THEME.primary },
    {
      label: "Del",
      val: "DELETE",
      type: "delete",
      icon: "trash-outline",
      color: THEME.danger,
    },
  ];
  const rowActions: SymbolButton[] = [
    {
      label: "Undo",
      val: "UNDO",
      type: "history",
      icon: "arrow-undo",
      color: THEME.accent,
    },
    {
      label: "Redo",
      val: "REDO",
      type: "history",
      icon: "arrow-redo",
      color: THEME.accent,
    },
    {
      label: "Bksp",
      val: "BACKSPACE",
      type: "action",
      icon: "backspace",
      color: THEME.danger,
    },
    {
      label: "Ent",
      val: "\n",
      type: "action",
      icon: "return-down-back",
      color: THEME.primary,
    },
  ];

  const handleFinishText = () => {
    setUseSystemKeyboard(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <CustomModal
        visible={exitModalVisible}
        title="Unsaved Changes"
        message="Would you like to save your progress before leaving?"
        onCancel={() => setExitModalVisible(false)}
        onConfirm={() => onSave(currentSong)}
        confirmText="Save"
        secondAction={onBack}
        secondActionText="Discard"
      />
      <CustomModal
        visible={deleteModalVisible}
        title="Delete Song"
        message="Are you sure you want to delete this song? This cannot be undone."
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={() => {
          setDeleteModalVisible(false);
          if (currentSong.id) onDelete(currentSong.id);
          else onBack();
        }}
        confirmText="Delete"
        confirmColor={THEME.danger}
      />

      <View style={styles.editorHeader}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerToggleGroup}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              notation === "numbers" && styles.toggleBtnActive,
            ]}
            onPress={() => setNotation("numbers")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                notation === "numbers" && { color: "#000" },
              ]}
            >
              #
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              notation === "chords" && styles.toggleBtnActive,
            ]}
            onPress={() => setNotation("chords")}
          >
            <Text
              style={[
                styles.toggleBtnText,
                notation === "chords" && { color: "#000" },
              ]}
            >
              Abc
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setIsEditing(!isEditing);
            if (isEditing) setUseSystemKeyboard(false);
          }}
        >
          <Ionicons
            name={isEditing ? "lock-open" : "lock-closed"}
            size={26}
            color={isEditing ? THEME.primary : THEME.textDim}
          />
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.metaContainer}>
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={currentSong.title}
              placeholder="Song Title"
              placeholderTextColor={THEME.textDim}
              onChangeText={(t) => {
                setCurrentSong({ ...currentSong, title: t });
                setHasUnsavedChanges(true);
              }}
            />
          ) : (
            <View style={styles.viewModeTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titleDisplay}>
                  {currentSong.title || "Untitled"}
                </Text>
              </View>
              <View style={styles.viewModeKeyBadge}>
                <Text style={styles.viewModeKeyLabel}>KEY</Text>
                <Text style={styles.viewModeKeyText}>{currentSong.key}</Text>
              </View>
            </View>
          )}
        </View>

        {isEditing && (
          <View style={styles.keySelector}>
            <Text style={styles.label}>SET KEY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {KEYS.map((k) => (
                <TouchableOpacity
                  key={k}
                  onPress={() => {
                    setCurrentSong({ ...currentSong, key: k });
                    setHasUnsavedChanges(true);
                  }}
                  style={[
                    styles.keyChip,
                    currentSong.key === k && styles.keyActive,
                  ]}
                >
                  <Text
                    style={{
                      color: currentSong.key === k ? "#000" : THEME.text,
                      fontWeight: "bold",
                    }}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.editorWrapper}>
          <TextInput
            ref={inputRef}
            style={[styles.mainEditor, { opacity: isEditing ? 1 : 0.8 }]}
            multiline={true}
            editable={isEditing}
            showSoftInputOnFocus={useSystemKeyboard}
            blurOnSubmit={useSystemKeyboard}
            returnKeyType={useSystemKeyboard ? "done" : "default"}
            onSubmitEditing={useSystemKeyboard ? handleFinishText : undefined}
            onSelectionChange={(e) => setCursorPos(e.nativeEvent.selection)}
            onChangeText={(t) => {
              if (useSystemKeyboard) {
                setCurrentSong({ ...currentSong, content: t });
                setHasUnsavedChanges(true);
              }
            }}
            placeholder={isEditing ? "| 1 4 | ... |" : ""}
            placeholderTextColor={THEME.textDim}
            textAlignVertical="top"
          >
            {renderStyledContent(currentSong.content)}
          </TextInput>
        </View>
      </ScrollView>

      {isEditing && !useSystemKeyboard && (
        <View style={styles.toolbarContainer}>
          <View style={styles.toolRow}>
            {(notation === "numbers" ? rowNumbers : rowChords).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.numBtn}
                onPress={() => handleCustomInput(s)}
              >
                <Text style={styles.numBtnText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.toolRowScrollable}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {rowTypes.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.typeBtn}
                  onPress={() => handleCustomInput(s)}
                >
                  <Text style={styles.typeBtnText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.toolRow}>
            {rowFormatting.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.formatBtn}
                onPress={() => {
                  if (s.val === "DELETE") setDeleteModalVisible(true);
                  else handleCustomInput(s);
                }}
              >
                {s.icon ? (
                  <Ionicons
                    name={s.icon}
                    size={20}
                    color={s.color || THEME.text}
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionBtnText,
                      s.color && { color: s.color },
                      s.label === "Space" && { fontSize: 12 },
                    ]}
                  >
                    {s.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.toolRow}>
            {rowActions.map((s, i) => (
              <TouchableOpacity
                key={i}
                disabled={
                  s.val === "UNDO"
                    ? history.length === 0
                    : s.val === "REDO"
                    ? redoStack.length === 0
                    : false
                }
                style={[
                  styles.actionBtn,
                  {
                    flex: 1,
                    opacity:
                      (s.val === "UNDO" && history.length === 0) ||
                      (s.val === "REDO" && redoStack.length === 0)
                        ? 0.3
                        : 1,
                  },
                ]}
                onPress={() => {
                  if (s.val === "UNDO") handleUndo();
                  else if (s.val === "REDO") handleRedo();
                  else handleCustomInput(s);
                }}
              >
                {s.icon ? (
                  <Ionicons
                    name={s.icon}
                    size={22}
                    color={s.color || THEME.text}
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionBtnText,
                      s.color && { color: s.color },
                    ]}
                  >
                    {s.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerToggleGroup: {
    flexDirection: "row",
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: THEME.primary },
  toggleBtnText: { color: THEME.text, fontSize: 18, fontWeight: "800" },
  metaContainer: { paddingHorizontal: 20, paddingTop: 20 },
  titleInput: { fontSize: 26, color: THEME.text, fontWeight: "800" },
  viewModeTitleRow: { flexDirection: "row", alignItems: "center" },
  titleDisplay: { fontSize: 28, color: THEME.text, fontWeight: "800" },
  viewModeKeyBadge: {
    backgroundColor: THEME.card,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 65,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  viewModeKeyLabel: {
    color: THEME.textDim,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  viewModeKeyText: { color: THEME.primary, fontSize: 28, fontWeight: "900" },
  keySelector: { marginTop: 15, paddingLeft: 20, marginBottom: 10 },
  label: {
    color: THEME.textDim,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  keyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  keyActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  editorWrapper: { paddingHorizontal: 20, paddingTop: 20 },
  mainEditor: {
    color: THEME.text,
    fontSize: 32,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    lineHeight: 48,
  },
  rootText: { fontSize: 32, fontWeight: "bold", color: THEME.text },
  modifierText: { fontSize: 18, color: THEME.primary, fontWeight: "bold" },
  toolbarContainer: {
    backgroundColor: THEME.toolbar,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  toolRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  toolRowScrollable: { flexDirection: "row", marginBottom: 8 },
  numBtn: {
    flex: 1,
    backgroundColor: "#EAEAEA",
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 2,
  },
  numBtnText: { color: "#000", fontWeight: "800", fontSize: 20 },
  typeBtn: {
    backgroundColor: THEME.card,
    height: 40,
    paddingHorizontal: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  typeBtnText: { color: THEME.text, fontWeight: "600", fontSize: 15 },
  formatBtn: {
    flex: 1,
    backgroundColor: "#333",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 2,
  },
  actionBtn: {
    backgroundColor: "#333",
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 2,
  },
  actionBtnText: { color: THEME.text, fontWeight: "700", fontSize: 16 },
});
