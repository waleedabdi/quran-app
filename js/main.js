// main.js - starts the app and connects api.js, audio.js, validation.js and ui.js.

import {
  getSurahs,
  getSurah,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  getNotes,
  addNote,
  replaceNote,
  deleteNote,
  getProgress,
  updateProgress,
} from "./api.js";
import { loadTracks, playFrom, toggle, stop, setHandlers } from "./audio.js";
import { validateNote, validateVerse } from "./validation.js";
import {
  showLoading,
  showError,
  hideError,
  showFeedback,
  showView,
  renderSurahs,
  renderReading,
  setTextSize,
  scrollToVerse,
  highlightVerse,
  setPlaying,
  renderBookmarks,
  markBookmarks,
  renderNotes,
  fillNoteForm,
  resetNoteForm,
  showNoteError,
  renderContinue,
} from "./ui.js";

const translationSelect = document.querySelector("#translation-select");
const textSize = document.querySelector("#text-size");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const noteForm = document.querySelector("#note-form");
const noteText = document.querySelector("#note-text");
const noteId = document.querySelector("#note-id");

let currentSurah = null;      // the surah number you are reading
let currentSurahName = "";    // its English name
let allSurahs = [];
let bookmarks = [];           // all saved bookmarks
let notes = [];               // all saved notes
let progress = null;          // where you stopped reading
let retryAction = loadSurahs; // what the "Try again" button should repeat

// ---------- Surah list ----------

async function loadSurahs() {
  retryAction = loadSurahs;
  showLoading(true);
  hideError();

  try {
    allSurahs = await getSurahs();
    renderSurahs(allSurahs, searchInput.value);
  } catch (error) {
    console.error(error);
    showError("Could not load the surahs. Check your internet connection and try again.");
  } finally {
    showLoading(false);
  }
}

// ---------- Your saved data (GET) ----------

// Loads bookmarks, notes and your last-read place from this browser.
async function loadSavedData() {
  try {
    [bookmarks, notes, progress] = await Promise.all([
      getBookmarks(),
      getNotes(),
      getProgress(),
    ]);
    renderBookmarks(bookmarks);
    renderNotes(notes);
    renderContinue(progress);
  } catch (error) {
    console.error(error);
    retryAction = loadSavedData;
    showError("Could not load your saved data. Check that browser storage is enabled and try again.");
  }
}

// ---------- Reading view ----------

// "ayah" is optional. If you give it, the page scrolls to that verse.
async function openSurah(number, ayah) {
  currentSurah = number;
  retryAction = () => openSurah(number, ayah);
  showLoading(true);
  hideError();

  try {
    const editions = await getSurah(number, translationSelect.value);
    currentSurahName = editions[0].englishName;
    const audioLinks = renderReading(editions);
    loadTracks(audioLinks);
    setTextSize(textSize.value);
    markBookmarks(currentSurah, bookmarks);
    showView("reading");
    if (ayah) scrollToVerse(ayah);
  } catch (error) {
    console.error(error);
    showError("Could not load this surah. Check your internet connection and try again.");
  } finally {
    showLoading(false);
  }
}

// ---------- Bookmarks (POST and DELETE) ----------

async function toggleBookmark(ayah) {
  const check = validateVerse({ surah: currentSurah, ayah });
  if (!check.valid) {
    showError(check.message);
    return;
  }

  const existing = bookmarks.find(
    (bookmark) => bookmark.surah === currentSurah && bookmark.ayah === ayah
  );

  try {
    hideError();

    if (existing) {
      await deleteBookmark(existing.id);
      bookmarks = bookmarks.filter((bookmark) => bookmark.id !== existing.id);
      showFeedback("Bookmark removed.");
    } else {
      const saved = await addBookmark({
        surah: currentSurah,
        surahName: currentSurahName,
        ayah,
      });
      bookmarks.push(saved);
      showFeedback("Bookmark saved.");
    }

    renderBookmarks(bookmarks);
    markBookmarks(currentSurah, bookmarks);
  } catch (error) {
    console.error(error);
    retryAction = () => toggleBookmark(ayah);
    showError("Could not save your bookmark. Check that browser storage is enabled and try again.");
  }
}

async function removeBookmark(id) {
  try {
    hideError();
    await deleteBookmark(id);
    bookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    renderBookmarks(bookmarks);
    if (currentSurah) markBookmarks(currentSurah, bookmarks);
    showFeedback("Bookmark removed.");
  } catch (error) {
    console.error(error);
    retryAction = () => removeBookmark(id);
    showError("Could not delete the bookmark. Check that browser storage is enabled and try again.");
  }
}

// ---------- Notes (POST, PUT and DELETE) ----------

async function saveNote(event) {
  event.preventDefault();

  const editingId = noteId.value ? Number(noteId.value) : null;
  const check = validateNote(noteText.value, notes, editingId);

  if (!check.valid) {
    showNoteError(check.message); // tell the user what to fix
    return;
  }
  showNoteError("");

  const data = { text: check.text, updatedAt: new Date().toISOString() };

  try {
    if (editingId) {
      // PUT: replace the whole note with the new version
      const updated = await replaceNote(editingId, { id: editingId, ...data });
      notes = notes.map((note) => (note.id === editingId ? updated : note));
      showFeedback("Note updated.");
    } else {
      // POST: create a new note
      const saved = await addNote(data);
      notes.push(saved);
      showFeedback("Note saved.");
    }

    renderNotes(notes);
    resetNoteForm();
  } catch (error) {
    console.error(error);
    showNoteError("Could not save your note. Check that browser storage is enabled and try again.");
  }
}

async function removeNote(id) {
  try {
    hideError();
    await deleteNote(id);
    notes = notes.filter((note) => note.id !== id);
    renderNotes(notes);
    if (Number(noteId.value) === id) resetNoteForm();
    showFeedback("Note deleted.");
  } catch (error) {
    console.error(error);
    retryAction = () => removeNote(id);
    showError("Could not delete the note. Check that browser storage is enabled and try again.");
  }
}

// ---------- Last-read position (PATCH) ----------

async function saveProgress(ayah) {
  const check = validateVerse({ surah: currentSurah, ayah });
  if (!check.valid) {
    showError(check.message);
    return;
  }

  try {
    hideError();
    // Update only the current reading position.
    progress = await updateProgress({
      surah: currentSurah,
      surahName: currentSurahName,
      ayah,
    });
    renderContinue(progress);
    showFeedback("Saved where you stopped reading.");
  } catch (error) {
    console.error(error);
    retryAction = () => saveProgress(ayah);
    showError("Could not save your place. Check that browser storage is enabled and try again.");
  }
}

// ---------- Audio ----------

setHandlers({
  onTrack: (index) => {
    highlightVerse(index);
    if (index >= 0) hideError();
  },
  onState: setPlaying,
  onError: () => showError("The audio could not be played. Check your internet connection and try again."),
});

// ---------- Clicks ----------

searchForm.addEventListener("submit", (event) => event.preventDefault());
searchInput.addEventListener("input", () => renderSurahs(allSurahs, searchInput.value));

document.querySelector("#surah-list").addEventListener("click", (event) => {
  const card = event.target.closest(".surah-card");
  if (card) openSurah(Number(card.dataset.number));
});

document.querySelector("#verses").addEventListener("click", (event) => {
  const bookmarkButton = event.target.closest(".verse-bookmark");
  const stopButton = event.target.closest(".verse-stop");
  const playButton = event.target.closest(".verse-play");

  if (bookmarkButton) toggleBookmark(Number(bookmarkButton.dataset.ayah));
  if (stopButton) saveProgress(Number(stopButton.dataset.ayah));
  if (playButton) playFrom(Number(playButton.dataset.index));
});

document.querySelector("#continue-button").addEventListener("click", () => {
  if (progress) openSurah(progress.surah, progress.ayah);
});

document.querySelector("#bookmark-list").addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".bookmark-delete");
  if (deleteButton) removeBookmark(Number(deleteButton.dataset.id));
});

document.querySelector("#note-list").addEventListener("click", (event) => {
  const editButton = event.target.closest(".note-edit");
  const deleteButton = event.target.closest(".note-delete");

  if (editButton) {
    const note = notes.find((item) => item.id === Number(editButton.dataset.id));
    if (note) fillNoteForm(note);
  }
  if (deleteButton) removeNote(Number(deleteButton.dataset.id));
});

noteForm.addEventListener("submit", saveNote);
document.querySelector("#note-cancel").addEventListener("click", resetNoteForm);

document.querySelector("#browse-surahs").addEventListener("click", () => showView("home"));

document.querySelector("#play-surah").addEventListener("click", toggle);
document.querySelector("#audio-toggle").addEventListener("click", toggle);

document.querySelectorAll("[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    hideError();
    stop();
    showView(link.dataset.view);
  });
});

document.querySelector("#back-button").addEventListener("click", () => {
  hideError();
  stop();
  showView("home");
});

translationSelect.addEventListener("change", () => {
  if (currentSurah) openSurah(currentSurah);
});

textSize.addEventListener("input", () => setTextSize(textSize.value));

document.querySelector("#retry").addEventListener("click", () => retryAction());

// ---------- Start ----------

loadSurahs();
loadSavedData();