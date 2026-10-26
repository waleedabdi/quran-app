import { jest, describe, test, expect, beforeEach } from "@jest/globals";
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
} from "../js/api.js";

// Builds a fake answer, like the one fetch gives back.
function fakeResponse(data, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => (data === null ? "" : JSON.stringify(data)),
  };
}

beforeEach(() => {
  global.fetch = jest.fn(); // a fake fetch, so no real internet is used
  const values = new Map();
  global.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
});

describe("Quran API", () => {
  test("getSurahs returns the list of surahs", async () => {
    fetch.mockResolvedValue(fakeResponse({ data: [{ number: 1 }, { number: 2 }] }));

    const result = await getSurahs();

    expect(result).toEqual([{ number: 1 }, { number: 2 }]);
    expect(fetch).toHaveBeenCalledWith("https://api.alquran.cloud/v1/surah");
  });

  test("getSurah asks for the Arabic, translation and audio editions", async () => {
    fetch.mockResolvedValue(fakeResponse({ data: ["arabic", "translation", "audio"] }));

    const result = await getSurah(2, "en.sahih");

    expect(result).toEqual(["arabic", "translation", "audio"]);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.alquran.cloud/v1/surah/2/editions/quran-uthmani,en.sahih,ar.alafasy"
    );
  });

  test("throws a clear error when the API answers with an error", async () => {
    fetch.mockResolvedValue(fakeResponse({}, { ok: false, status: 500 }));

    await expect(getSurahs()).rejects.toThrow("Request failed with status 500");
  });

  test("throws when the network is down", async () => {
    fetch.mockRejectedValue(new Error("Network down"));

    await expect(getSurahs()).rejects.toThrow("Network down");
  });
});

describe("Bookmarks", () => {
  test("returns an empty list when no bookmarks are saved", async () => {
    await expect(getBookmarks()).resolves.toEqual([]);
  });

  test("saves bookmarks and assigns unique IDs", async () => {
    const bookmark = { surah: 1, surahName: "Al-Fatihah", ayah: 3 };
    await expect(addBookmark(bookmark)).resolves.toEqual({ id: 1, ...bookmark });
    await expect(addBookmark(bookmark)).resolves.toEqual({ id: 2, ...bookmark });
    await expect(getBookmarks()).resolves.toEqual([
      { id: 1, ...bookmark },
      { id: 2, ...bookmark },
    ]);
  });

  test("deletes a bookmark without changing other bookmarks", async () => {
    await addBookmark({ surah: 1, ayah: 2 });
    await addBookmark({ surah: 2, ayah: 3 });

    await expect(deleteBookmark(1)).resolves.toBeNull();
    await expect(getBookmarks()).resolves.toEqual([{ id: 2, surah: 2, ayah: 3 }]);
  });
});

describe("Notes", () => {
  test("returns an empty list when no notes are saved", async () => {
    await expect(getNotes()).resolves.toEqual([]);
  });

  test("saves notes and assigns an ID", async () => {
    const note = { text: "A note", updatedAt: "2026-10-22" };
    await expect(addNote(note)).resolves.toEqual({ id: 1, ...note });
    await expect(getNotes()).resolves.toEqual([{ id: 1, ...note }]);
  });

  test("replaces the full note while preserving its ID", async () => {
    await addNote({ text: "Old text", updatedAt: "2026-10-21" });
    const note = { text: "New text", updatedAt: "2026-10-22" };

    await expect(replaceNote(1, note)).resolves.toEqual({ id: 1, ...note });
    await expect(getNotes()).resolves.toEqual([{ id: 1, ...note }]);
  });

  test("rejects when replacing a missing note", async () => {
    await expect(replaceNote(1, { text: "New text" })).rejects.toThrow("Note 1 was not found.");
  });

  test("deletes a note", async () => {
    await addNote({ text: "A note" });

    await expect(deleteNote(1)).resolves.toBeNull();
    await expect(getNotes()).resolves.toEqual([]);
  });
});

describe("Last-read position", () => {
  test("returns null when no position has been saved", async () => {
    await expect(getProgress()).resolves.toBeNull();
  });

  test("saves and updates the last-read position", async () => {
    await expect(updateProgress({ surah: 2, ayah: 10 })).resolves.toEqual({
      id: 1,
      surah: 2,
      ayah: 10,
    });
    await updateProgress({ surahName: "Al-Baqarah", ayah: 11 });

    await expect(getProgress()).resolves.toEqual({
      id: 1,
      surah: 2,
      surahName: "Al-Baqarah",
      ayah: 11,
    });
  });

  test("preserves saved data across API calls", async () => {
    await addBookmark({ surah: 3, ayah: 4 });
    await addNote({ text: "Remember this" });

    await expect(getBookmarks()).resolves.toEqual([{ id: 1, surah: 3, ayah: 4 }]);
    await expect(getNotes()).resolves.toEqual([{ id: 1, text: "Remember this" }]);
  });
});