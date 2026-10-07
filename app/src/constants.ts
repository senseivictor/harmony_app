export const THEME = {
  bg: "#121214",
  card: "#1E1E24",
  primary: "#00C896",
  accent: "#7F5AF0",
  text: "#EAEAEA",
  textDim: "#888888",
  border: "#2A2A35",
  toolbar: "#1F1F24",
  danger: "#FF4757",
  selected: "#2A2A35",
  overlay: "rgba(0,0,0,0.8)",
};

export const KEYS: string[] = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export const KEY_MAP: Record<string, string[]> = {
  C: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  "C#": ["C#", "D", "D#", "E", "E#", "F#", "G", "G#", "A", "A#", "B", "B#"],
  D: ["D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B", "C", "C#"],
  Eb: ["Eb", "Fb", "F", "Gb", "G", "Ab", "A", "Bb", "Cb", "C", "Db", "D"],
  E: ["E", "F", "F#", "G", "G#", "A", "Bb", "B", "C", "C#", "D", "D#"],
  F: ["F", "Gb", "G", "Ab", "A", "Bb", "Cb", "C", "Db", "D", "Eb", "E"],
  "F#": ["F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "E#"],
  G: ["G", "Ab", "A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "F#"],
  Ab: ["Ab", "Bbb", "Bb", "Cb", "C", "Db", "D", "Eb", "Fb", "F", "Gb", "G"],
  A: ["A", "Bb", "B", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#"],
  Bb: ["Bb", "Cb", "C", "Db", "D", "Eb", "Fb", "F", "Gb", "G", "Ab", "A"],
  B: ["B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#"],
};

export const DISTANCE_TO_DEGREE: Record<number, string> = {
  0: "1",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "b6",
  9: "6",
  10: "b7",
  11: "7",
};

export const normalizeNote = (note: string): string => {
  const fixes: Record<string, string> = {
    "E#": "F",
    "B#": "C",
    Fb: "E",
    Cb: "B",
    "D##": "E",
    "F##": "G",
    "G##": "A",
    "A##": "B",
    "C##": "D",
    Gbb: "F",
    Abb: "G",
    Bbb: "A",
    Dbb: "C",
    Ebb: "D",
  };
  return fixes[note] || note;
};
