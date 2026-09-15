/* Full melody: notes 1–12 underground, notes 13–42 around the board. */
(function (root) {
  const phrases = [
    ["C4", "C4", "G4", "G4"], ["A4", "A4", "G4"],
    ["F4", "F4", "E4", "E4"], ["D4", "D4", "C4"],
    ["G4", "G4", "F4", "F4"], ["E4", "E4", "D4"],
    ["G4", "G4", "F4", "F4"], ["E4", "E4", "D4"],
    ["C4", "C4", "G4", "G4"], ["A4", "A4", "G4"],
    ["F4", "F4", "E4", "E4"], ["D4", "D4", "C4"]
  ];
  const notes = {
    C4: { label: "ド", midi: 60, step: 0, color: "#ef6a67" },
    D4: { label: "レ", midi: 62, step: 1, color: "#f29b52" },
    E4: { label: "ミ", midi: 64, step: 2, color: "#e5c64f" },
    F4: { label: "ファ", midi: 65, step: 3, color: "#63b875" },
    G4: { label: "ソ", midi: 67, step: 4, color: "#4da9c9" },
    A4: { label: "ラ", midi: 69, step: 5, color: "#6f86d6" },
    B4: { label: "シ", midi: 71, step: 6, color: "#9a72c7" }
  };
  let position = 0;
  const measures = phrases.map((phrase, measure) => phrase.map((pitch, index) => ({
    pitch, beats: phrase.length === 3 && index === 2 ? 2 : 1,
    position: position++, measure
  })));
  root.MineSong = { title: "きらきら星", bpm: 108, notes, measures, melody: measures.flat() };
})(globalThis);
