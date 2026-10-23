// api.js - all the code that talks to other servers lives here.

const QURAN_API = "https://api.alquran.cloud/v1";
const AUDIO_EDITION = "ar.alafasy"; // the reciter whose audio we use
const DB_API = "http://localhost:3000"; // your json-server (change this when you deploy)

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

// ---------- Your json-server (bookmarks, notes, progress) ----------

// One helper for every request to your own server.
async function request(path, options = {}) {
  const response = await fetch(`${DB_API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text(); // DELETE may send back nothing
  return text ? JSON.parse(text) : null;
}

// Bookmarks: GET, POST, DELETE
export function getBookmarks() {
  return request("/bookmarks");
}

export function addBookmark(bookmark) {
  return request("/bookmarks", { method: "POST", body: JSON.stringify(bookmark) });
}

export function deleteBookmark(id) {
  return request(`/bookmarks/${id}`, { method: "DELETE" });
}

// Notes: GET, POST, PUT, DELETE
export function getNotes() {
  return request("/notes");
}

export function addNote(note) {
  return request("/notes", { method: "POST", body: JSON.stringify(note) });
}

// PUT replaces the WHOLE note with the new version.
export function replaceNote(id, note) {
  return request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(note) });
}

export function deleteNote(id) {
  return request(`/notes/${id}`, { method: "DELETE" });
}

// Last-read position: GET and PATCH (there is only one record, with id 1)
export function getProgress() {
  return request("/progress/1");
}

// PATCH changes only the fields you send. The rest stay the same.
export function updateProgress(changes) {
  return request("/progress/1", { method: "PATCH", body: JSON.stringify(changes) });
}