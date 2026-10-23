import { describe, test, expect } from "@jest/globals";
import { validateNote, validateVerse } from "../js/validation.js";

describe("validateNote", () => {
  test("rejects an empty note", () => {
    const result = validateNote("   ");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Note cannot be empty.");
  });

  test("rejects a missing note", () => {
    expect(validateNote(undefined).valid).toBe(false);
  });

  test("rejects a note that is too short", () => {
    const result = validateNote("ab");
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Note must be at least 3 characters.");
  });

  test("rejects a note that is too long", () => {
    const result = validateNote("a".repeat(501));
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Note cannot be longer than 500 characters.");
  });

  test("accepts a note that is exactly 500 characters", () => {
    expect(validateNote("a".repeat(500)).valid).toBe(true);
  });

  test("accepts a good note and trims the spaces", () => {
    const result = validateNote("  A good note  ");
    expect(result).toEqual({ valid: true, message: "", text: "A good note" });
  });

  test("rejects a duplicate note, ignoring capital letters", () => {
    const notes = [{ id: 1, text: "Remember this" }];
    const result = validateNote("remember this", notes);
    expect(result.valid).toBe(false);
    expect(result.message).toBe("You already saved this note.");
  });

  test("allows the same text when you are editing that same note", () => {
    const notes = [{ id: 1, text: "Remember this" }];
    expect(validateNote("Remember this", notes, 1).valid).toBe(true);
  });
});

describe("validateVerse", () => {
  test("accepts a real surah and verse", () => {
    expect(validateVerse({ surah: 1, ayah: 1 })).toEqual({ valid: true, message: "" });
  });

  test("rejects a surah below 1 or above 114", () => {
    expect(validateVerse({ surah: 0, ayah: 1 }).valid).toBe(false);
    expect(validateVerse({ surah: 115, ayah: 1 }).valid).toBe(false);
  });

  test("rejects a surah that is not a whole number", () => {
    expect(validateVerse({ surah: 1.5, ayah: 1 }).valid).toBe(false);
  });

  test("rejects a verse below 1", () => {
    const result = validateVerse({ surah: 2, ayah: 0 });
    expect(result.valid).toBe(false);
    expect(result.message).toBe("Verse must be a number that is 1 or higher.");
  });

  test("rejects a verse that is text instead of a number", () => {
    expect(validateVerse({ surah: 2, ayah: "3" }).valid).toBe(false);
  });
});