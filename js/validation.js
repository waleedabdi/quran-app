// validation.js - checks what the user types BEFORE we send it anywhere.
// These functions only check things. They never touch the page.

const MIN_NOTE_LENGTH = 3;
const MAX_NOTE_LENGTH = 500;

// Checks a note. "notes" is the list we already have, "editingId" is the
// id of the note being edited (or null for a brand new note).
export function validateNote(text, notes = [], editingId = null) {
  const cleaned = String(text ?? "").trim();

  if (cleaned === "") {
    return { valid: false, message: "Note cannot be empty." };
  }
  if (cleaned.length < MIN_NOTE_LENGTH) {
    return { valid: false, message: `Note must be at least ${MIN_NOTE_LENGTH} characters.` };
  }
  if (cleaned.length > MAX_NOTE_LENGTH) {
    return { valid: false, message: `Note cannot be longer than ${MAX_NOTE_LENGTH} characters.` };
  }

  const isDuplicate = notes.some(
    (note) =>
      note.id !== editingId &&
      note.text.trim().toLowerCase() === cleaned.toLowerCase()
  );
  if (isDuplicate) {
    return { valid: false, message: "You already saved this note." };
  }

  return { valid: true, message: "", text: cleaned };
}

// Checks a verse location, like { surah: 2, ayah: 255 }.
export function validateVerse({ surah, ayah }) {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return { valid: false, message: "Surah must be a number from 1 to 114." };
  }
  if (!Number.isInteger(ayah) || ayah < 1) {
    return { valid: false, message: "Verse must be a number that is 1 or higher." };
  }
  return { valid: true, message: "" };
}