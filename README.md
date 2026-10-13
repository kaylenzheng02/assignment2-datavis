# Assignment 2 — TrES-2

Two pages for **TrES-2** (catalog star **`TrES_Lyr1_01614`**). A planet passes in front of this star about every 2.5 days. While it does, the star looks a little dimmer. The first page shows that dimming and photos of the star. The second page places every star in the survey on a sphere you can rotate.

## Run locally

Chart.js loads JSON with `fetch`, so open the site through a local server (not as a `file://` URL):

```bash
python -m http.server 8765
```

Then visit [http://127.0.0.1:8765/](http://127.0.0.1:8765/). The survey sphere is at [http://127.0.0.1:8765/survey/](http://127.0.0.1:8765/survey/).

## What the page shows

1. **Summary** — what TrES-2 is, and what the transit chart measures.
2. **Photos** — a close view of the star and a wider Kepler field with TrES-2 marked.
3. **Transit chart** — brightness versus time for one crossing, from `tres2-lightcurve.json`.
4. **Survey sphere** — a second page, `survey/index.html`. Every star in the TrES Lyr1 catalog, from `TRESCSV.json`, on a celestial sphere you can rotate and zoom.

## Transit chart

One star, one crossing. The dip in the middle is the planet blocking a small part of the star’s light.

| On the chart | Meaning |
|--------------|---------|
| **X-axis** | Hours before (−) or after (+) the middle. `0` is when the planet is straight in front of the star. |
| **Y-axis** | **Relative flux.** `1` is normal brightness. The dip near `0.984` is about 98.4% of normal. |
| **Dots and bars** | IAC80 measurements and their uncertainty (Rabus et al. 2009). |
| **Solid line** | Transit model. Hide it with **Show transit model**. |

**Flux** is how much light we receive. Relative flux compares the star with its usual brightness, so a small dip is easy to see. Higher means brighter. That is the opposite of magnitude, where a smaller number means a brighter star.

Hover a point for the time, the flux, the percent of normal brightness, and the uncertainty. Drag to zoom, scroll to zoom, Shift+drag to pan, and use **Reset zoom** to return.

## Survey sphere

Each dot is one of the ~25,947 stars in TrES Lyr1, placed on a celestial sphere by right ascension and declination. The catalog records where each star is, not its light curve.

| On the sphere | Meaning |
|---------------|---------|
| **Grid** | Right ascension and declination, like longitude and latitude. |
| **Bright outline** | The patch of sky the survey covers. |
| **Marked point** | TrES-2 (`TrES_Lyr1_01614`). |

Drag to rotate, scroll to zoom, and use **Reset view** to return. Hover a star for its catalog id, sky position, V magnitude, and how many light-curve points the archive lists.

## Demo

1. Read the summary, then point at the photos: this is the star, not a picture of the planet.
2. On the transit chart, point at the flat parts: normal starlight, flux near 1.
3. Point at the dip: the planet is in front, so the star looks fainter.
4. Hover one point, toggle **Show transit model**, then zoom into the dip.
5. Open the survey sphere: drag to turn it, then zoom in. TrES-2 is one star in a field of thousands.

## Files

| File | Role |
|------|------|
| `index.html` | Light-curve page |
| `style.css` | Light-curve page styling |
| `script.js` | Loads the light curve and builds the Chart.js chart |
| `survey/index.html` | Survey sphere page |
| `survey/style.css` | Survey sphere styling |
| `survey/script.js` | Loads the catalog and renders the rotatable sphere |
| `tres2-lightcurve.json` | Time, relative flux, uncertainty, and the transit model for TrES-2 |
| `TRESCSV.json` | NASA catalog of ~25,947 stars in TrES Lyr1 |
| `assets/` | Kepler images of the TrES-2 field |

The catalog says which stars were observed. The light-curve file is the brightness-versus-time data for this one star. The page converts that time from days to hours.

## Data sources

- Catalog: [NASA Exoplanet Archive](http://exoplanetarchive.ipac.caltech.edu)
- Light curve: Rabus et al. 2009, VizieR `J/A+A/508/1011/tres2pho`
- Images: NASA/JPL-Caltech, PIA11985; NASA/Ames/JPL-Caltech, PIA11984
