const font = { family: '"Times New Roman", Times, serif', size: 16 };
const ink = "#111";

const viewLimits = {
  x: { min: -0.1, max: 0.1 },
  y: { min: 0.975, max: 1.012 },
};

const errorBars = {
  id: "errorBars",
  afterDatasetsDraw(chart) {
    const points = chart.$points;
    if (!points) return;

    const meta = chart.getDatasetMeta(0);
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
      const err = points[index][2];
      const flux = points[index][1];
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
    ctx.font = "italic 18px \"Times New Roman\", Times, serif";
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

function axisOptions(title) {
  return {
    title: { display: true, text: title, color: ink, font, padding: 8 },
    ticks: { color: ink, font },
    grid: { color: "rgba(0, 0, 0, 0.18)" },
    border: { color: ink },
  };
}

function formatReadout(time, flux, err) {
  return `t = ${time.toFixed(4)} days · flux = ${flux.toFixed(4)} ± ${err.toFixed(4)}`;
}

function setReadout(text) {
  document.getElementById("readout").textContent = text;
}

async function main() {
  const response = await fetch("tres2-lightcurve.json");
  if (!response.ok) {
    throw new Error(`Could not load light curve (${response.status})`);
  }

  const curve = await response.json();
  const canvas = document.getElementById("magChart");
  const chart = new Chart(canvas, {
    type: "scatter",
    plugins: [errorBars, seriesLabel, crosshair],
    data: {
      datasets: [
        {
          label: curve.instrument,
          data: curve.points.map(([t, flux]) => ({ x: t, y: flux })),
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 12,
        },
        {
          label: "Transit model",
          type: "line",
          data: curve.model.map(([t, flux]) => ({ x: t, y: flux })),
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
        if (item.datasetIndex !== 0) return;

        const [time, flux, err] = curve.points[item.index];
        chart.$crosshairX = item.element.x;
        setReadout(formatReadout(time, flux, err));
        chart.draw();
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(items) {
              const item = items[0];
              return `t = ${item.parsed.x.toFixed(4)} days`;
            },
            label(item) {
              if (item.datasetIndex === 1) {
                return `model flux ${item.parsed.y.toFixed(4)}`;
              }
              const err = curve.points[item.dataIndex][2];
              return `flux ${item.parsed.y.toFixed(4)} ± ${err.toFixed(4)}`;
            },
          },
        },
        zoom: {
          limits: {
            x: { min: -0.12, max: 0.12, minRange: 0.01 },
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
          ...axisOptions("time from center of transit (days)"),
          type: "linear",
          min: viewLimits.x.min,
          max: viewLimits.x.max,
          ticks: {
            color: ink,
            font,
            maxTicksLimit: 9,
            callback: (value) => Number(value).toFixed(2),
          },
        },
        y: {
          ...axisOptions("relative flux"),
          min: viewLimits.y.min,
          max: viewLimits.y.max,
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
    `${curve.star_id} during transit. ${curve.instrument} relative photometry from ${curve.source}. Drag on the chart to zoom, scroll to zoom in/out, Shift+drag to pan, and hover to read individual points.`;

  document.getElementById("showModel").addEventListener("change", (event) => {
    chart.setDatasetVisibility(1, event.target.checked);
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
