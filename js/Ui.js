// ui.js - all the code that changes what you see on the page lives here.

const loadingBox = document.querySelector("#loading");
const errorBox = document.querySelector("#error");
const errorMessage = document.querySelector("#error-message");
const surahList = document.querySelector("#surah-list");

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