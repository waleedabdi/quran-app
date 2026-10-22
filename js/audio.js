// audio.js - everything about playing sound lives here.
// It does not touch the page. It just tells main.js what is happening.

const player = document.querySelector("#player");

let tracks = [];   // the audio link for every verse
let current = -1;  // which verse is playing (-1 means none)
let handlers = {
  onTrack: () => {}, // called when a new verse starts
  onState: () => {}, // called when playing or pausing
  onError: () => {}, // called when the audio fails
};

export function setHandlers(newHandlers) {
  handlers = { ...handlers, ...newHandlers };
}

// Gives the player the list of audio links for the surah you opened.
export function loadTracks(urls) {
  stop();
  tracks = urls;
}

// Starts playing from a verse, then keeps going verse after verse.
export function playFrom(index) {
  if (index < 0 || index >= tracks.length) return;

  current = index;
  player.src = tracks[index];
  player.play().catch(() => handlers.onError());
  handlers.onTrack(index);
}

// Play button: start from verse 1, or pause, or carry on.
export function toggle() {
  if (current === -1) {
    playFrom(0);
  } else if (player.paused) {
    player.play().catch(() => handlers.onError());
  } else {
    player.pause();
  }
}

export function stop() {
  player.pause();
  current = -1;
  handlers.onTrack(-1);
}

player.addEventListener("play", () => handlers.onState(true));
player.addEventListener("pause", () => handlers.onState(false));
player.addEventListener("error", () => {
  if (current !== -1) handlers.onError();
});

// When one verse ends, play the next one.
player.addEventListener("ended", () => {
  if (current + 1 < tracks.length) {
    playFrom(current + 1);
  } else {
    stop();
  }
});