// ui.js - all the code that changes what you see on the page lives here.

const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const errorMessage = document.querySelector("#error-message");
const feedbackBox = document.querySelector("#feedback");
const surahList = document.querySelector("#surah-list");
const surahEmpty = document.querySelector("#surah-empty");
const readingTitle = document.querySelector("#reading-title");
const versesBox = document.querySelector("#verses");
const audioToggle = document.querySelector("#audio-toggle");
const playSurahButton = document.querySelector("#play-surah");
const bookmarkList = document.querySelector("#bookmark-list");
const bookmarkEmpty = document.querySelector("#bookmark-empty");
const browseButton = document.querySelector("#browse-surahs");
const noteList = document.querySelector("#note-list");
const noteEmpty = document.querySelector("#note-empty");
const noteFormTitle = document.querySelector("#note-form-title");
const noteId = document.querySelector("#note-id");
const noteText = document.querySelector("#note-text");
const noteError = document.querySelector("#note-error");
const noteSave = document.querySelector("#note-save");
const noteCancel = document.querySelector("#note-cancel");
const continueCard = document.querySelector("#continue-card");
const continueText = document.querySelector("#continue-text");
const views = document.querySelectorAll("main > section");

let feedbackTimer = null;

// Makes a new element, gives it a class and some text.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Makes a small button with an accessible label.
function makeButton(className, text, label) {
  const button = makeElement("button", className, text);
  button.type = "button";
  if (label) button.setAttribute("aria-label", label);
  return button;
}

// ---------- Messages ----------

export function showLoading(isLoading) {
  loadingBox.hidden = !isLoading;
}

export function showError(message) {
  errorMessage.textContent = message;
  errorBox.hidden = false;
}

export function hideError() {
  errorBox.hidden = true;
}

// A short "it worked" message that disappears by itself.
export function showFeedback(message) {
  feedbackBox.textContent = message;
  feedbackBox.hidden = false;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedbackBox.hidden = true;
  }, 2500);
}

// Shows one screen ("home", "reading", "bookmarks" or "notes") and hides the others.
export function showView(name) {
  views.forEach((view) => {
    view.hidden = view.id !== `view-${name}`;
  });
}

// ---------- Surahs ----------

export function renderSurahs(surahs, query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const isNumberQuery = /^\d+$/.test(normalizedQuery);
  const matchingSurahs = normalizedQuery
    ? surahs.filter((surah) =>
        isNumberQuery
          ? surah.number === Number(normalizedQuery)
          : [surah.name, surah.englishName].some((value) =>
              String(value).toLocaleLowerCase().includes(normalizedQuery)
            )
      )
    : surahs;

  surahList.replaceChildren(); // clear the old list first

  matchingSurahs.forEach((surah) => {
    const item = document.createElement("li");

    const card = makeButton("surah-card");
    card.dataset.number = surah.number;

    const arabicName = makeElement("span", "arabic", surah.name);
    arabicName.lang = "ar";
    arabicName.dir = "rtl";

    card.append(
      makeElement("span", "surah-number", surah.number),
      makeElement("span", "surah-name", surah.englishName),
      arabicName,
      makeElement("span", "surah-count", `${surah.numberOfAyahs} verses`)
    );

    item.append(card);
    surahList.append(item);
  });

  surahEmpty.hidden = !normalizedQuery || matchingSurahs.length > 0;
}

// ---------- Reading view ----------

// Draws the title and every verse. "editions" is [arabic, translation, audio].
// Returns the list of audio links, one for each verse.
export function renderReading(editions) {
  const [arabic, translation, audio] = editions;

  readingTitle.textContent = `${arabic.number}. ${arabic.englishName}`;
  versesBox.replaceChildren();

  arabic.ayahs.forEach((ayah, index) => {
    const verse = makeElement("div", "verse");
    verse.dataset.number = ayah.numberInSurah;

    const arabicText = makeElement("p", "arabic", ayah.text);
    arabicText.lang = "ar";
    arabicText.dir = "rtl";

    const translatedText = makeElement(
      "p",
      "translation",
      `${ayah.numberInSurah}. ${translation.ayahs[index].text}`
    );

    const bookmarkButton = makeButton(
      "verse-bookmark",
      "Bookmark",
      `Bookmark verse ${ayah.numberInSurah}`
    );
    bookmarkButton.dataset.ayah = ayah.numberInSurah;
    bookmarkButton.setAttribute("aria-pressed", "false");

    const stopButton = makeButton(
      "verse-stop",
      "Stopped here",
      `Save verse ${ayah.numberInSurah} as where I stopped reading`
    );
    stopButton.dataset.ayah = ayah.numberInSurah;

    const playButton = makeButton("verse-play", "Play", `Play verse ${ayah.numberInSurah}`);
    playButton.dataset.index = index;

    verse.append(arabicText, translatedText, bookmarkButton, stopButton, playButton);
    versesBox.append(verse);
  });

  return audio.ayahs.map((ayah) => ayah.audio);
}

export function setTextSize(pixels) {
  versesBox.style.setProperty("--arabic-size", `${pixels}px`);
}

// Scrolls the page to one verse.
export function scrollToVerse(ayah) {
  const verse = versesBox.querySelector(`.verse[data-number="${ayah}"]`);
  if (verse) verse.scrollIntoView({ block: "center" });
}

// Highlights the verse that is playing (-1 removes the highlight).
export function highlightVerse(index) {
  const verses = versesBox.querySelectorAll(".verse");
  verses.forEach((verse, i) => verse.classList.toggle("playing", i === index));

  if (index >= 0 && verses[index]) {
    verses[index].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

export function setPlaying(isPlaying) {
  audioToggle.textContent = isPlaying ? "Pause" : "Play";
  playSurahButton.textContent = isPlaying ? "Pause surah" : "Play surah";
}

// ---------- Bookmarks ----------

export function renderBookmarks(bookmarks) {
  bookmarkList.replaceChildren();

  bookmarks.forEach((bookmark) => {
    const item = document.createElement("li");
    const label = makeElement(
      "span",
      "bookmark-label",
      `${bookmark.surahName}, verse ${bookmark.ayah}`
    );

    const deleteButton = makeButton(
      "bookmark-delete",
      "Delete",
      `Delete bookmark ${bookmark.surahName} verse ${bookmark.ayah}`
    );
    deleteButton.dataset.id = bookmark.id;

    item.append(label, deleteButton);
    bookmarkList.append(item);
  });

  const isEmpty = bookmarks.length === 0;
  bookmarkEmpty.hidden = !isEmpty;
  browseButton.hidden = !isEmpty;
}

// On the reading screen, shows which verses are already bookmarked.
export function markBookmarks(surahNumber, bookmarks) {
  versesBox.querySelectorAll(".verse-bookmark").forEach((button) => {
    const ayah = Number(button.dataset.ayah);
    const isSaved = bookmarks.some(
      (bookmark) => bookmark.surah === surahNumber && bookmark.ayah === ayah
    );
    button.textContent = isSaved ? "Bookmarked" : "Bookmark";
    button.setAttribute("aria-pressed", String(isSaved));
  });
}

// ---------- Notes ----------

export function renderNotes(notes) {
  noteList.replaceChildren();

  notes.forEach((note) => {
    const item = document.createElement("li");

    const text = makeElement("p", "note-text", note.text);
    const date = makeElement(
      "p",
      "note-date",
      `Updated ${new Date(note.updatedAt).toLocaleDateString()}`
    );

    const editButton = makeButton("note-edit", "Edit", "Edit this note");
    editButton.dataset.id = note.id;
    const deleteButton = makeButton("note-delete", "Delete", "Delete this note");
    deleteButton.dataset.id = note.id;

    item.append(text, date, editButton, deleteButton);
    noteList.append(item);
  });

  noteEmpty.hidden = notes.length > 0;
}

// Puts a note into the form so you can edit it.
export function fillNoteForm(note) {
  noteId.value = note.id;
  noteText.value = note.text;
  noteFormTitle.textContent = "Edit note";
  noteSave.textContent = "Update note";
  noteCancel.hidden = false;
  showNoteError("");
  noteText.focus();
}

// Puts the form back to "new note".
export function resetNoteForm() {
  noteId.value = "";
  noteText.value = "";
  noteFormTitle.textContent = "New note";
  noteSave.textContent = "Save note";
  noteCancel.hidden = true;
  showNoteError("");
}

// Shows a message under the note box. An empty message clears it.
export function showNoteError(message) {
  noteError.textContent = message;
  noteText.setAttribute("aria-invalid", message ? "true" : "false");
}

// ---------- Continue reading ----------

export function renderContinue(progress) {
  const hasPlace = Boolean(progress && progress.surahName);
  continueCard.hidden = !hasPlace;
  if (hasPlace) {
    continueText.textContent = `${progress.surahName}, verse ${progress.ayah}`;
  }
}