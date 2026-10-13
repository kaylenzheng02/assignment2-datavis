// runs the survey sphere when #skyStage is on the page

import { initSkySphere } from "./sky-sphere.js";

initSkySphere().catch((error) => {
  const readout = document.getElementById("skyReadout");
  if (readout) readout.textContent = error.message;
});
