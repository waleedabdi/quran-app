// ui.js - all the code that changes what you see on the page lives here.

const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const errorMessage = document.querySelector("#error-message");
const surahList = document.querySelector("#surah-list");
const readingTitle = document.querySelector("#reading-title");
const versesBox = document.querySelector("#verses");
const audioToggle = document.querySelector("#audio-toggle");
const playSurahButton = document.querySelector("#play-surah");
const views = document.querySelectorAll("main > section");

// Makes a new element, gives it a class and some text.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

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

// Shows one screen ("home", "reading", "bookmarks" or "notes") and hides the others.
export function showView(name) {
  views.forEach((view) => {
    view.hidden = view.id !== `view-${name}`;
  });
}

// Draws one card for every surah in the array.
export function renderSurahs(surahs) {
  surahList.replaceChildren(); // clear the old list first

  surahs.forEach((surah) => {
    const item = document.createElement("li");

    const card = makeElement("button", "surah-card");
    card.type = "button";
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
}

// Draws the title and every verse of the surah you opened.
// "editions" is the array from getSurah: [arabic, translation, audio].
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

    const playButton = makeElement("button", "verse-play", "Play");
    playButton.type = "button";
    playButton.dataset.index = index;
    playButton.setAttribute("aria-label", `Play verse ${ayah.numberInSurah}`);

    verse.append(arabicText, translatedText, playButton);
    versesBox.append(verse);
  });

  return audio.ayahs.map((ayah) => ayah.audio);
}

// Changes the size of the Arabic text.
export function setTextSize(pixels) {
  versesBox.style.setProperty("--arabic-size", `${pixels}px`);
}

// Highlights the verse that is playing (-1 removes the highlight).
export function highlightVerse(index) {
  const verses = versesBox.querySelectorAll(".verse");
  verses.forEach((verse, i) => verse.classList.toggle("playing", i === index));

  if (index >= 0 && verses[index]) {
    verses[index].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Changes the button words between Play and Pause.
export function setPlaying(isPlaying) {
  audioToggle.textContent = isPlaying ? "Pause" : "Play";
  playSurahButton.textContent = isPlaying ? "Pause surah" : "Play surah";
}