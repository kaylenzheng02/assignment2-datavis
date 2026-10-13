import { initSkySphere } from "../sky-sphere.js";

initSkySphere({ catalogUrl: "../TRESCSV.json" }).catch((error) => {
  document.getElementById("skyReadout").textContent = error.message;
});
