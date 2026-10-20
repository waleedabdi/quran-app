// main.js - starts the app and connects api.js to ui.js.

import { getSurahs } from "./api.js";
import { showLoading, showError, hideError, renderSurahs } from "./ui.js";

async function loadSurahs() {
  showLoading(true);
  hideError();

  try {
    const surahs = await getSurahs();
    renderSurahs(surahs);
  } catch (error) {
    console.error(error);
    showError("Could not load the surahs. Check your internet connection and try again.");
  } finally {
    showLoading(false); // runs whether it worked or failed
  }
}

document.querySelector("#retry").addEventListener("click", loadSurahs);

loadSurahs();