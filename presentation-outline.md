# TrES-2 light curve — presentation outline

Copy each block into one slide. Demo the live site on the last slide (or split demo across slides 5–6).

---

## Slide 1 — Title

**TrES-2 transit light curve**

Interactive visualization with Chart.js

Your name · Assignment 2

---

## Slide 2 — What is this?

- A **light curve**: star brightness **vs time**
- **TrES-2** = a star with a known **transiting exoplanet**
- When the planet passes in front of the star, we see a **dip** in brightness
- Our page lets you **explore** that dip interactively

---

## Slide 3 — The survey (context)

- **TrES** (Trans-atlantic Exoplanet Survey) watched many stars in **TrES Lyr1** (Lyra)
- **`TRESCSV.json`**: NASA catalog of ~25,947 stars (positions, magnitudes, metadata)
- This star in the catalog: **`TrES_Lyr1_01614`** = **TrES-2**
- The **chart** uses phased photometry from the literature, not the whole catalog at once

---

## Slide 4 — Reading the chart

| Axis / element | Meaning |
|----------------|---------|
| **X** | Time from **center of transit** (days); `0` = mid-transit |
| **Y** | **Relative flux** — 1 = normal brightness; lower = dimmer |
| **Dots ± bars** | IAC80 measurements + uncertainty |
| **Solid line** | Transit **model** fit |

The dip (~1.5%) = planet blocking part of the star’s light

---

## Slide 5 — What is flux?

- **Flux** = amount of light received from the star
- **Relative flux** = compared to normal (set ~**1** outside transit)
- Makes a **small** dip easy to see (~0.985 vs 1.000)
- Note: unlike **magnitude**, higher flux = **brighter** here

---

## Slide 6 — Interactivity (assignment)

- **Hover** → time, flux, uncertainty (readout + tooltip)
- **Checkbox** → show/hide transit model
- **Zoom** → drag box, scroll wheel; **Shift+drag** to pan; **Reset zoom**

*Live demo: http://127.0.0.1:8765/ (run `python -m http.server 8765` first)*

---

## Slide 7 — Why it matters

- Transits are a key way to **find** and **characterize** exoplanets
- TrES-2 was the first transiting planet in the **Kepler** field
- Same idea as big missions: measure the dip → infer planet size/orbit

---

## Slide 8 — Tech stack (optional)

- **HTML / CSS / JavaScript**
- **Chart.js** + zoom plugin
- Data: `tres2-lightcurve.json`, catalog `TRESCSV.json`
- Sources: NASA Exoplanet Archive; Rabus et al. 2009 (VizieR)

---

## Speaker notes — 2-minute demo order

1. Flat top of curve → “normal starlight”
2. Center dip → “planet in front”
3. Hover one point
4. Toggle model off/on
5. Zoom into the bottom of the transit
