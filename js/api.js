// api.js - all the code that talks to the Quran API lives here.

const QURAN_API = "https://api.alquran.cloud/v1";
const AUDIO_EDITION = "ar.alafasy"; // the reciter whose audio we use

// One small helper that every request uses.
async function fetchJson(path) {
  const response = await fetch(`${QURAN_API}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

// All 114 surahs.
export function getSurahs() {
  return fetchJson("/surah");
}

// One surah in three editions at once: Arabic text, a translation, and audio.
// Returns an array: [arabicEdition, translationEdition, audioEdition]
export function getSurah(number, translation) {
  return fetchJson(
    `/surah/${number}/editions/quran-uthmani,${translation},${AUDIO_EDITION}`
  );
}