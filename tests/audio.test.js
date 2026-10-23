/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeAll, beforeEach } from "@jest/globals";

let audio;
let player;
let handlers;

beforeAll(async () => {
  document.body.innerHTML = '<audio id="player"></audio>';

  // jsdom cannot really play sound, so we use fake play and pause.
  window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = jest.fn();

  audio = await import("../js/audio.js");
  player = document.querySelector("#player");
});

beforeEach(() => {
  handlers = { onTrack: jest.fn(), onState: jest.fn(), onError: jest.fn() };
  audio.setHandlers(handlers);
  audio.loadTracks(["https://example.com/1.mp3", "https://example.com/2.mp3"]);

  // Start every test with clean fakes.
  handlers.onTrack.mockClear();
  window.HTMLMediaElement.prototype.play.mockClear();
  window.HTMLMediaElement.prototype.pause.mockClear();
});

describe("playing verses", () => {
  test("playFrom plays the chosen verse", () => {
    audio.playFrom(0);

    expect(player.src).toBe("https://example.com/1.mp3");
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(handlers.onTrack).toHaveBeenCalledWith(0);
  });

  test("playFrom ignores a verse that does not exist", () => {
    audio.playFrom(5);
    audio.playFrom(-1);

    expect(handlers.onTrack).not.toHaveBeenCalled();
  });

  test("when a verse ends, the next verse starts", () => {
    audio.playFrom(0);
    player.dispatchEvent(new Event("ended"));

    expect(player.src).toBe("https://example.com/2.mp3");
    expect(handlers.onTrack).toHaveBeenLastCalledWith(1);
  });

  test("when the last verse ends, playing stops", () => {
    audio.playFrom(1);
    player.dispatchEvent(new Event("ended"));

    expect(handlers.onTrack).toHaveBeenLastCalledWith(-1);
  });
});

describe("toggle (the Play and Pause button)", () => {
  test("starts from the first verse when nothing is playing", () => {
    audio.toggle();

    expect(player.src).toBe("https://example.com/1.mp3");
    expect(handlers.onTrack).toHaveBeenCalledWith(0);
  });

  test("carries on when it was paused", () => {
    audio.playFrom(0);
    window.HTMLMediaElement.prototype.play.mockClear();

    audio.toggle(); // jsdom says the player is paused

    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  test("pauses when it is playing", () => {
    audio.playFrom(0);
    Object.defineProperty(player, "paused", { value: false, configurable: true });

    audio.toggle();

    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    Object.defineProperty(player, "paused", { value: true, configurable: true });
  });
});

describe("events and errors", () => {
  test("tells the app when playing starts and pauses", () => {
    player.dispatchEvent(new Event("play"));
    expect(handlers.onState).toHaveBeenLastCalledWith(true);

    player.dispatchEvent(new Event("pause"));
    expect(handlers.onState).toHaveBeenLastCalledWith(false);
  });

  test("reports an error while a verse is playing", () => {
    audio.playFrom(0);
    player.dispatchEvent(new Event("error"));

    expect(handlers.onError).toHaveBeenCalled();
  });

  test("does not report an error when nothing is playing", () => {
    audio.stop();
    player.dispatchEvent(new Event("error"));

    expect(handlers.onError).not.toHaveBeenCalled();
  });

  test("reports an error when the browser refuses to play", async () => {
    window.HTMLMediaElement.prototype.play.mockImplementationOnce(() =>
      Promise.reject(new Error("blocked"))
    );

    audio.playFrom(0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handlers.onError).toHaveBeenCalled();
  });
});