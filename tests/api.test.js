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
  test("getBookmarks sends a GET request", async () => {
    fetch.mockResolvedValue(fakeResponse([{ id: 1 }]));

    const result = await getBookmarks();

    expect(result).toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/bookmarks",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } })
    );
  });

  test("addBookmark sends a POST request with the bookmark", async () => {
    const bookmark = { surah: 1, surahName: "Al-Fatihah", ayah: 3 };
    fetch.mockResolvedValue(fakeResponse({ id: 1, ...bookmark }));

    const result = await addBookmark(bookmark);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/bookmarks");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(bookmark);
    expect(result.id).toBe(1);
  });

  test("deleteBookmark sends a DELETE request and handles an empty answer", async () => {
    fetch.mockResolvedValue(fakeResponse(null));

    const result = await deleteBookmark(3);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/bookmarks/3");
    expect(options.method).toBe("DELETE");
    expect(result).toBeNull();
  });
});

describe("Notes", () => {
  test("getNotes sends a GET request", async () => {
    fetch.mockResolvedValue(fakeResponse([]));

    await getNotes();

    expect(fetch.mock.calls[0][0]).toBe("http://localhost:3000/notes");
  });

  test("addNote sends a POST request", async () => {
    const note = { text: "A note", updatedAt: "2026-10-22" };
    fetch.mockResolvedValue(fakeResponse({ id: 1, ...note }));

    await addNote(note);

    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(note);
  });

  test("replaceNote sends a PUT request with the whole note", async () => {
    const note = { id: 2, text: "New text", updatedAt: "2026-10-22" };
    fetch.mockResolvedValue(fakeResponse(note));

    const result = await replaceNote(2, note);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/notes/2");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual(note);
    expect(result).toEqual(note);
  });

  test("deleteNote sends a DELETE request", async () => {
    fetch.mockResolvedValue(fakeResponse(null));

    await deleteNote(2);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/notes/2");
    expect(options.method).toBe("DELETE");
  });
});

describe("Last-read position", () => {
  test("getProgress sends a GET request for record 1", async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 1, surah: 1, ayah: 1 }));

    const result = await getProgress();

    expect(fetch.mock.calls[0][0]).toBe("http://localhost:3000/progress/1");
    expect(result.id).toBe(1);
  });

  test("updateProgress sends a PATCH request with only the changes", async () => {
    fetch.mockResolvedValue(fakeResponse({ id: 1, surah: 2, ayah: 10 }));

    await updateProgress({ surah: 2, ayah: 10 });

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://localhost:3000/progress/1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ surah: 2, ayah: 10 });
  });

  test("throws when your server answers with an error", async () => {
    fetch.mockResolvedValue(fakeResponse({}, { ok: false, status: 404 }));

    await expect(getProgress()).rejects.toThrow("Request failed with status 404");
  });
});