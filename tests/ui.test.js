/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeAll } from "@jest/globals";

// A tiny fake page with every element ui.js looks for.
const fakePage = `
  <p id="loading" hidden></p>
  <div id="error" hidden><p id="error-message"></p></div>
  <p id="feedback" hidden></p>
  <main>
    <section id="view-home"></section>
    <section id="view-reading" hidden></section>
  </main>
  <ul id="surah-list"></ul>
  <h2 id="reading-title"></h2>
  <div id="verses"></div>
  <button id="audio-toggle">Play</button>
  <button id="play-surah">Play surah</button>
  <ul id="bookmark-list"></ul>
  <p id="bookmark-empty" hidden></p>
  <button id="browse-surahs" hidden>Browse surahs</button>
  <ul id="note-list"></ul>
  <p id="note-empty" hidden></p>
  <h3 id="note-form-title">New note</h3>
  <input id="note-id" type="hidden" />
  <textarea id="note-text"></textarea>
  <p id="note-error"></p>
  <button id="note-save">Save note</button>
  <button id="note-cancel" hidden>Cancel</button>
  <section id="continue-card" hidden></section>
  <p id="continue-text"></p>
`;

// Made-up data in the same shape the API sends.
const editions = [
  {
    number: 1,
    englishName: "Al-Fatihah",
    ayahs: [
      { numberInSurah: 1, text: "arabic one" },
      { numberInSurah: 2, text: "arabic two" },
    ],
  },
  { ayahs: [{ text: "translation one" }, { text: "translation two" }] },
  {
    ayahs: [
      { audio: "https://example.com/1.mp3" },
      { audio: "https://example.com/2.mp3" },
    ],
  },
];

const $ = (selector) => document.querySelector(selector);

let ui;

beforeAll(async () => {
  document.body.innerHTML = fakePage;
  window.HTMLElement.prototype.scrollIntoView = jest.fn(); // jsdom cannot scroll
  ui = await import("../js/ui.js"); // load it AFTER the fake page exists
});

describe("messages", () => {
  test("showLoading shows and hides the loading message", () => {
    ui.showLoading(true);
    expect($("#loading").hidden).toBe(false);
    ui.showLoading(false);
    expect($("#loading").hidden).toBe(true);
  });

  test("showError and hideError work", () => {
    ui.showError("Something broke");
    expect($("#error").hidden).toBe(false);
    expect($("#error-message").textContent).toBe("Something broke");
    ui.hideError();
    expect($("#error").hidden).toBe(true);
  });

  test("showFeedback disappears after 2.5 seconds", () => {
    jest.useFakeTimers();
    ui.showFeedback("Saved");
    expect($("#feedback").hidden).toBe(false);
    expect($("#feedback").textContent).toBe("Saved");
    jest.advanceTimersByTime(2500);
    expect($("#feedback").hidden).toBe(true);
    jest.useRealTimers();
  });
});

describe("screens", () => {
  test("showView shows one screen and hides the others", () => {
    ui.showView("reading");
    expect($("#view-home").hidden).toBe(true);
    expect($("#view-reading").hidden).toBe(false);
  });
});

describe("surah list", () => {
  test("renderSurahs draws one card for each surah", () => {
    ui.renderSurahs([
      { number: 1, name: "arabic name", englishName: "Al-Fatihah", numberOfAyahs: 7 },
    ]);

    const cards = document.querySelectorAll(".surah-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].dataset.number).toBe("1");
    expect(cards[0].textContent).toContain("Al-Fatihah");
    expect(cards[0].textContent).toContain("7 verses");

    const arabic = cards[0].querySelector(".arabic");
    expect(arabic.lang).toBe("ar");
    expect(arabic.dir).toBe("rtl");
  });
});

describe("reading view", () => {
  test("renderReading draws the verses and returns the audio links", () => {
    const links = ui.renderReading(editions);

    expect($("#reading-title").textContent).toBe("1. Al-Fatihah");
    expect(document.querySelectorAll(".verse")).toHaveLength(2);
    expect(document.querySelectorAll(".verse-bookmark")).toHaveLength(2);
    expect(document.querySelectorAll(".verse-stop")).toHaveLength(2);
    expect(links).toEqual(["https://example.com/1.mp3", "https://example.com/2.mp3"]);
  });

  test("setTextSize changes the Arabic size", () => {
    ui.setTextSize(32);
    expect($("#verses").style.getPropertyValue("--arabic-size")).toBe("32px");
  });

  test("markBookmarks marks the saved verses", () => {
    ui.markBookmarks(1, [{ surah: 1, ayah: 2 }]);
    const buttons = document.querySelectorAll(".verse-bookmark");

    expect(buttons[0].textContent).toBe("Bookmark");
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
    expect(buttons[1].textContent).toBe("Bookmarked");
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
  });

  test("highlightVerse highlights one verse and can clear it", () => {
    ui.highlightVerse(1);
    const verses = document.querySelectorAll(".verse");
    expect(verses[0].classList.contains("playing")).toBe(false);
    expect(verses[1].classList.contains("playing")).toBe(true);

    ui.highlightVerse(-1);
    expect(verses[1].classList.contains("playing")).toBe(false);
  });

  test("scrollToVerse scrolls to the verse", () => {
    window.HTMLElement.prototype.scrollIntoView.mockClear();
    ui.scrollToVerse(2);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  test("setPlaying changes the button words", () => {
    ui.setPlaying(true);
    expect($("#audio-toggle").textContent).toBe("Pause");
    expect($("#play-surah").textContent).toBe("Pause surah");
    ui.setPlaying(false);
    expect($("#audio-toggle").textContent).toBe("Play");
    expect($("#play-surah").textContent).toBe("Play surah");
  });
});

describe("bookmarks list", () => {
  test("shows the empty message when there are no bookmarks", () => {
    ui.renderBookmarks([]);
    expect($("#bookmark-empty").hidden).toBe(false);
    expect($("#browse-surahs").hidden).toBe(false);
  });

  test("lists the bookmarks with a Delete button", () => {
    ui.renderBookmarks([{ id: 5, surah: 1, surahName: "Al-Fatihah", ayah: 3 }]);

    expect(document.querySelectorAll("#bookmark-list li")).toHaveLength(1);
    expect($(".bookmark-label").textContent).toBe("Al-Fatihah, verse 3");
    expect($(".bookmark-delete").dataset.id).toBe("5");
    expect($("#bookmark-empty").hidden).toBe(true);
  });
});

describe("notes", () => {
  test("shows the empty message when there are no notes", () => {
    ui.renderNotes([]);
    expect($("#note-empty").hidden).toBe(false);
  });

  test("lists the notes with Edit and Delete buttons", () => {
    ui.renderNotes([{ id: 2, text: "A note", updatedAt: "2026-10-22T10:00:00.000Z" }]);

    expect($(".note-text").textContent).toBe("A note");
    expect($(".note-edit").dataset.id).toBe("2");
    expect($(".note-delete").dataset.id).toBe("2");
    expect($("#note-empty").hidden).toBe(true);
  });

  test("fillNoteForm puts a note in the form for editing", () => {
    ui.fillNoteForm({ id: 2, text: "A note" });

    expect($("#note-id").value).toBe("2");
    expect($("#note-text").value).toBe("A note");
    expect($("#note-form-title").textContent).toBe("Edit note");
    expect($("#note-save").textContent).toBe("Update note");
    expect($("#note-cancel").hidden).toBe(false);
  });

  test("resetNoteForm puts the form back to a new note", () => {
    ui.resetNoteForm();

    expect($("#note-id").value).toBe("");
    expect($("#note-text").value).toBe("");
    expect($("#note-form-title").textContent).toBe("New note");
    expect($("#note-save").textContent).toBe("Save note");
    expect($("#note-cancel").hidden).toBe(true);
  });

  test("showNoteError shows and clears the message", () => {
    ui.showNoteError("Note cannot be empty.");
    expect($("#note-error").textContent).toBe("Note cannot be empty.");
    expect($("#note-text").getAttribute("aria-invalid")).toBe("true");

    ui.showNoteError("");
    expect($("#note-text").getAttribute("aria-invalid")).toBe("false");
  });
});

describe("continue reading", () => {
  test("shows the card when a place was saved", () => {
    ui.renderContinue({ surahName: "Al-Fatihah", ayah: 4 });
    expect($("#continue-card").hidden).toBe(false);
    expect($("#continue-text").textContent).toBe("Al-Fatihah, verse 4");
  });

  test("hides the card when nothing was saved", () => {
    ui.renderContinue(null);
    expect($("#continue-card").hidden).toBe(true);
  });
});