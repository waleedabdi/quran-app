// api.js - all the code that talks to other servers lives here.

const QURAN_API = "https://api.alquran.cloud/v1";
const AUDIO_EDITION = "ar.alafasy"; // the reciter whose audio we use
const STORAGE_KEYS = {
  bookmarks: "noor-reader.bookmarks",
  notes: "noor-reader.notes",
  progress: "noor-reader.progress",
};

// ---------- Quran API (read-only) ----------

async function fetchJson(path) {
  const response = await fetch(`${QURAN_API}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// All 114 surahs.
export function getSurahs() {
  return fetchJson("/surah");
}

// One surah in three editions at once: Arabic text, a translation, and audio.
// Returns an array: [arabicEdition, translationEdition, audioEdition]
export function getSurah(number, translation) {
  return fetchJson(
    `/surah/${number}/editions/quran-uthmani,${translation},${AUDIO_EDITION}`
  );
}

// ---------- Browser storage (bookmarks, notes, progress) ----------

function getStorage() {
  if (!globalThis.localStorage) {
    throw new Error("Browser storage is unavailable.");
  }
  return globalThis.localStorage;
}

function readStoredValue(key, fallback) {
  const value = getStorage().getItem(key);
  return value === null ? fallback : JSON.parse(value);
}

function writeStoredValue(key, value) {
  getStorage().setItem(key, JSON.stringify(value));
}

function readCollection(key) {
  const collection = readStoredValue(key, []);
  if (!Array.isArray(collection)) {
    throw new Error(`Saved data for ${key} is not a list.`);
  }
  return collection;
}

function nextId(collection) {
  return collection.reduce((highest, item) => Math.max(highest, Number(item.id) || 0), 0) + 1;
}

// Bookmarks: read, create, delete
export async function getBookmarks() {
  return readCollection(STORAGE_KEYS.bookmarks);
}

export async function addBookmark(bookmark) {
  const bookmarks = readCollection(STORAGE_KEYS.bookmarks);
  const saved = { ...bookmark, id: nextId(bookmarks) };
  bookmarks.push(saved);
  writeStoredValue(STORAGE_KEYS.bookmarks, bookmarks);
  return saved;
}

export async function deleteBookmark(id) {
  const bookmarks = readCollection(STORAGE_KEYS.bookmarks);
  writeStoredValue(
    STORAGE_KEYS.bookmarks,
    bookmarks.filter((bookmark) => bookmark.id !== id)
  );
  return null;
}

// Notes: read, create, replace, delete
export async function getNotes() {
  return readCollection(STORAGE_KEYS.notes);
}

export async function addNote(note) {
  const notes = readCollection(STORAGE_KEYS.notes);
  const saved = { ...note, id: nextId(notes) };
  notes.push(saved);
  writeStoredValue(STORAGE_KEYS.notes, notes);
  return saved;
}

export async function replaceNote(id, note) {
  const notes = readCollection(STORAGE_KEYS.notes);
  const index = notes.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Note ${id} was not found.`);
  }
  const updated = { ...note, id };
  notes[index] = updated;
  writeStoredValue(STORAGE_KEYS.notes, notes);
  return updated;
}

export async function deleteNote(id) {
  const notes = readCollection(STORAGE_KEYS.notes);
  writeStoredValue(
    STORAGE_KEYS.notes,
    notes.filter((note) => note.id !== id)
  );
  return null;
}

// Last-read position
export async function getProgress() {
  return readStoredValue(STORAGE_KEYS.progress, null);
}

export async function updateProgress(changes) {
  const progress = { ...readStoredValue(STORAGE_KEYS.progress, {}), ...changes, id: 1 };
  writeStoredValue(STORAGE_KEYS.progress, progress);
  return progress;
}