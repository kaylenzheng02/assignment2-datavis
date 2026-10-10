# Assignment 2 — TrES-2 transit light curve

Interactive Chart.js visualization of **TrES-2** (catalog star **`TrES_Lyr1_01614`**) using NASA TrES Lyr1 data and published IAC80 transit photometry.

## Run locally

Chart.js loads JSON with `fetch`, so open the site through a local server (not as a `file://` URL):

```bash
python -m http.server 8765
```

Then visit [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

## What you are looking at

- **X-axis:** time from the center of the transit (days). `0` is mid-transit, when the planet is deepest in front of the star.
- **Y-axis:** **relative flux** — brightness compared to normal. Values near `1` mean unobstructed starlight; the dip (~0.985) is the planet blocking ~1.5% of the light.
- **Points + error bars:** measurements from IAC80 (Rabus et al. 2009, via VizieR).
- **Solid line:** a simple transit model fit to those points.

The **“From the TrES catalog”** box on the page pulls the matching row from **`TRESCSV.json`** (RA/Dec, R magnitude, number of archive light-curve points) so the plot is tied to the full survey catalog.

## Interactivity

- Hover a point for time, flux, and uncertainty (readout + tooltip).
- Toggle **Show transit model**.
- **Reset zoom**; drag to box-zoom; scroll to zoom; Shift+drag to pan.

## Files

| File | Role |
|------|------|
| `index.html` | Page structure |
| `style.css` | Layout and styling |
| `script.js` | Loads data, builds Chart.js plot, handles controls |
| `TRESCSV.json` | NASA Exoplanet Archive catalog (~25,947 stars in TrES Lyr1) |
| `tres2-lightcurve.json` | Phased relative-flux time series + model for TrES-2 |
| `TRESCSV.xlsx` | Original spreadsheet export (source for the JSON) |

## Data sources

- Catalog: [NASA Exoplanet Archive](http://exoplanetarchive.ipac.caltech.edu)
- Light curve: Rabus et al. 2009, VizieR `J/A+A/508/1011/tres2pho`
