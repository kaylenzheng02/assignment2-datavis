// TrES-2 page: Chart.js transit light curve.

const fontFamily = '"Geist Sans", system-ui, sans-serif';
const font = { family: fontFamily, size: 14 };
const ink = "#111";

const HOURS_PER_DAY = 24;

//  zoom on the transit chart (time in hours, flux as a fraction of normal).
const transitView = {
  x: { min: -2.4, max: 2.4 },
  y: { min: 0.975, max: 1.012 },
};

// dataset order inside the transit chart (used when reading hover / tooltip indices).
const TRANSIT_DATA = 0; // IAC80 measurements
const TRANSIT_MODEL = 1; // fitted transit curve

function axisOptions(title) {
  return {
    title: { display: true, text: title, color: ink, font, padding: 8 },
    ticks: { color: ink, font },
    grid: { color: "rgba(0, 0, 0, 0.18)" },
    border: { color: ink },
  };
}

async function loadJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${label} (${response.status})`);
  }
  return response.json();
}

function hoursFromDays(days) {
  return days * HOURS_PER_DAY;
}

// Each light-curve row is [time in days, flux, uncertainty].
function transitPoint(row) {
  return { x: hoursFromDays(row[0]), y: row[1] };
}

function formatWhen(hours) {
  const clock = Math.abs(hours).toFixed(2);
  if (hours < -0.05) return `${clock} hours before the middle`;
  if (hours > 0.05) return `${clock} hours after the middle`;
  return "the middle of the transit";
}

function formatTransitReadout(hours, flux, err) {
  const percent = (flux * 100).toFixed(1);
  return `${formatWhen(hours)} · flux ${flux.toFixed(4)} (${percent}% of normal brightness) ± ${err.toFixed(4)}`;
}

function setReadout(text) {
  document.getElementById("readout").textContent = text;
}

const errorBars = {
  id: "errorBars",
  afterDatasetsDraw(chart) {
    const points = chart.$points;
    if (!points) return;

    const meta = chart.getDatasetMeta(TRANSIT_DATA);
    if (meta.hidden) return;

    const yScale = chart.scales.y;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;

    meta.data.forEach((point, index) => {
      if (point.skip) return;
      const row = points[index];
      const flux = row[1];
      const err = row[2];
      const top = yScale.getPixelForValue(flux + err);
      const bottom = yScale.getPixelForValue(flux - err);
      ctx.beginPath();
      ctx.moveTo(point.x, top);
      ctx.lineTo(point.x, bottom);
      ctx.moveTo(point.x - 3, top);
      ctx.lineTo(point.x + 3, top);
      ctx.moveTo(point.x - 3, bottom);
      ctx.lineTo(point.x + 3, bottom);
      ctx.stroke();
    });

    ctx.restore();
  },
};

const seriesLabel = {
  id: "seriesLabel",
  afterDraw(chart) {
    const label = chart.$instrument;
    if (!label) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.fillStyle = ink;
    ctx.font = `italic 16px ${fontFamily}`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(label, chartArea.right - 8, chartArea.top + 6);
    ctx.restore();
  },
};

const crosshair = {
  id: "crosshair",
  afterDraw(chart) {
    const x = chart.$crosshairX;
    if (x == null) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

// --- Transit chart ---
async function main() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const curve = await loadJson("tres2-lightcurve.json", "light curve");
  const canvas = document.getElementById("magChart");
  const chart = new Chart(canvas, {
    type: "scatter",
    plugins: [errorBars, seriesLabel, crosshair],
    data: {
      datasets: [
        {
          label: curve.instrument,
          data: curve.points.map(transitPoint),
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 12,
        },
        {
          label: "Transit model",
          type: "line",
          data: curve.model.map(transitPoint),
          pointRadius: 0,
          borderColor: ink,
          borderWidth: 1.5,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      aspectRatio: 1.85,
      clip: 0,
      animation: false,
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      onHover(_event, elements) {
        if (!elements.length) {
          chart.$crosshairX = null;
          setReadout("Hover over the chart to inspect a measurement.");
          chart.draw();
          return;
        }

        const item = elements[0];
        if (item.datasetIndex !== TRANSIT_DATA) return;

        const row = curve.points[item.index];
        const timeDays = row[0];
        const flux = row[1];
        const err = row[2];
        chart.$crosshairX = item.element.x;
        setReadout(formatTransitReadout(hoursFromDays(timeDays), flux, err));
        chart.draw();
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) {
              return formatWhen(items[0].parsed.x);
            },
            label(item) {
              const percent = (item.parsed.y * 100).toFixed(1);
              if (item.datasetIndex === TRANSIT_MODEL) {
                return `model ${item.parsed.y.toFixed(4)} (${percent}% of normal)`;
              }
              const err = curve.points[item.dataIndex][2];
              return `flux ${item.parsed.y.toFixed(4)} (${percent}% of normal) ± ${err.toFixed(4)}`;
            },
          },
        },
        zoom: {
          limits: {
            x: { min: -2.88, max: 2.88, minRange: 0.24 },
            y: { min: 0.97, max: 1.015, minRange: 0.002 },
          },
          pan: {
            enabled: true,
            mode: "xy",
            modifierKey: "shift",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            drag: {
              enabled: true,
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              borderColor: ink,
              borderWidth: 1,
            },
            mode: "xy",
          },
        },
      },
      scales: {
        x: {
          ...axisOptions("hours before (−) or after (+) the middle"),
          type: "linear",
          min: transitView.x.min,
          max: transitView.x.max,
          ticks: {
            color: ink,
            font,
            maxTicksLimit: 9,
            callback: (value) => Number(value).toFixed(1),
          },
        },
        y: {
          ...axisOptions("relative flux (1 = normal brightness)"),
          min: transitView.y.min,
          max: transitView.y.max,
          ticks: {
            color: ink,
            font,
            maxTicksLimit: 8,
            callback: (value) => Number(value).toFixed(3),
          },
        },
      },
    },
  });

  chart.$points = curve.points;
  chart.$instrument = curve.instrument;
  chart.update();

  document.getElementById("summary").textContent =
    `${curve.star_id} · ${curve.instrument} photometry · ${curve.source} · orbital period ${curve.period_days} days`;

  document.getElementById("showModel").addEventListener("change", (event) => {
    chart.setDatasetVisibility(TRANSIT_MODEL, event.target.checked);
    chart.update();
  });

  document.getElementById("resetZoom").addEventListener("click", () => {
    chart.resetZoom();
    chart.$crosshairX = null;
    setReadout("Hover over the chart to inspect a measurement.");
  });

  canvas.addEventListener("mouseleave", () => {
    chart.$crosshairX = null;
    setReadout("Hover over the chart to inspect a measurement.");
    chart.draw();
  });
}

main().catch((error) => {
  document.getElementById("summary").textContent = error.message;
});
