// api.js - all the code that talks to the Quran API lives here.

const QURAN_API = "https://api.alquran.cloud/v1";

// Asks the API for all 114 surahs and returns them as an array.
export async function getSurahs() {
  const response = await fetch(`${QURAN_API}/surah`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}