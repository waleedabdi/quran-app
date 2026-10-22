// main.js - starts the app and connects api.js, audio.js and ui.js.

import { getSurahs, getSurah } from "./api.js";
import { loadTracks, playFrom, toggle, stop, setHandlers } from "./audio.js";
import {
  showLoading,
  showError,
  hideError,
  showView,
  renderSurahs,
  renderReading,
  setTextSize,
  highlightVerse,
  setPlaying,
} from "./ui.js";

const translationSelect = document.querySelector("#translation-select");
const textSize = document.querySelector("#text-size");

let currentSurah = null;      // the surah number you are reading
let retryAction = loadSurahs; // what the "Try again" button should repeat

async function loadSurahs() {
  retryAction = loadSurahs;
  showLoading(true);
  hideError();

  try {
    const surahs = await getSurahs();
    renderSurahs(surahs);
  } catch (error) {
    console.error(error);
    showError("Could not load the surahs. Check your internet connection and try again.");
  } finally {
    showLoading(false);
  }
}

async function openSurah(number) {
  currentSurah = number;
  retryAction = () => openSurah(number);
  showLoading(true);
  hideError();

  try {
    const editions = await getSurah(number, translationSelect.value);
    const audioLinks = renderReading(editions);
    loadTracks(audioLinks);
    setTextSize(textSize.value);
    showView("reading");
  } catch (error) {
    console.error(error);
    showError("Could not load this surah. Check your internet connection and try again.");
  } finally {
    showLoading(false);
  }
}

// Tell audio.js what to do when something happens.
setHandlers({
  onTrack: (index) => {
    highlightVerse(index);
    if (index >= 0) hideError();
  },
  onState: setPlaying,
  onError: () => showError("The audio could not be played. Check your internet connection and try again."),
});

// Click on a surah card -> open that surah.
document.querySelector("#surah-list").addEventListener("click", (event) => {
  const card = event.target.closest(".surah-card");
  if (card) openSurah(Number(card.dataset.number));
});

// Click on a verse's Play button -> play from that verse.
document.querySelector("#verses").addEventListener("click", (event) => {
  const button = event.target.closest(".verse-play");
  if (button) playFrom(Number(button.dataset.index));
});

// The two big play buttons.
document.querySelector("#play-surah").addEventListener("click", toggle);
document.querySelector("#audio-toggle").addEventListener("click", toggle);

// Click on a menu link or the logo -> switch screen.
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

loadSurahs();