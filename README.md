# Assignment 2 — TrES-2 transit light curve

Interactive Chart.js visualization of **TrES-2** (catalog star **`TrES_Lyr1_01614`**) using NASA TrES Lyr1 survey metadata and published IAC80 transit photometry.

**In one sentence:** This page plots how a star’s brightness changes when its planet passes in front of it—a **transit**—and lets you explore that dip interactively.

For slide-by-slide copy, see **[presentation-outline.md](presentation-outline.md)**.

## Run locally

Chart.js loads JSON with `fetch`, so open the site through a local server (not as a `file://` URL):

```bash
python -m http.server 8765
```

Then visit [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

## Explaining this to an audience

### The story in three steps

1. **The survey** — The Trans-atlantic Exoplanet Survey (TrES) monitored many stars in one patch of sky (TrES Lyr1, in Lyra). If a star dims periodically in a smooth, repeatable way, that can mean a **planet** is blocking part of the star’s light.

2. **This chart** — It is not a photo of a planet. It is **brightness versus time** around one transit of **TrES-2**, a known exoplanet host. Outside the dip the star looks “normal”; in the middle the planet covers part of the disk and less light reaches us.

3. **Why interactivity matters** — The dip is only about **1–2%** deep. Hover, zoom, and compare to the model so the audience can see a shaped event, not random scatter.

### How to read the axes

- **X-axis:** time from the **center** of the transit (days). `0` is mid-transit, when the planet is deepest in front of the star.
- **Y-axis:** **relative flux** — brightness compared to normal. Values near `1` mean unobstructed starlight; the dip (~0.985) is the planet blocking ~1.5% of the light.
- **Dots + error bars:** real IAC80 measurements (Rabus et al. 2009, via VizieR). Each bar is measurement uncertainty.
- **Solid line:** a simple **transit model** fit to those points (you can hide it with the checkbox).

### What “flux” means

**Flux** is how much light we receive from the star. This plot uses **relative** flux: brightness normalized so that outside transit it is about **1**, which makes small changes easy to see. Higher flux = brighter here (unlike **magnitude**, where smaller numbers mean brighter).

### How the data files fit together

| File | Role in the story |
|------|-------------------|
| `TRESCSV.json` | **Catalog** of ~25,947 stars in the TrES Lyr1 field (sky position, magnitudes, how many archive points exist). TrES-2 is **`TrES_Lyr1_01614`** in this list. |
| `tres2-lightcurve.json` | **Time series** for this one system—what the chart actually plots (time, relative flux, error, plus a model curve). |

The catalog describes *which* stars were observed; the light-curve file is the detailed brightness-versus-time data for the demo.

### Suggested demo (~2 minutes)

1. Open the page and point at the flat regions: “Normal starlight—flux near 1.”
2. Point at the center dip: “Planet in front—the star looks fainter.”
3. Hover a point: “Each measurement has a time, flux, and uncertainty.”
4. Toggle **Show transit model**: “Compare data to a theoretical transit shape.”
5. Drag to zoom the dip: “The width and depth encode planet and orbit properties.”

### Why TrES-2 is interesting

Transits are a major way we find and study exoplanets. TrES-2 was the first transiting planet discovered in the **Kepler** field, so it was observed again with much higher precision later. This project is a small, interactive version of that core idea: **plot the light curve and inspect the transit.**

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
