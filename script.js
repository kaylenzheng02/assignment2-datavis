const font = { family: '"Times New Roman", Times, serif', size: 16 };
const ink = "#111";

const errorBars = {
  id: "errorBars",
  afterDatasetsDraw(chart) {
    const points = chart.$points;
    if (!points) return;

    const meta = chart.getDatasetMeta(0);
    const yScale = chart.scales.y;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;

    meta.data.forEach((point, index) => {
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

function axisOptions(title) {
  return {
    title: { display: true, text: title, color: ink, font, padding: 8 },
    ticks: { color: ink, font },
    grid: { color: "rgba(0, 0, 0, 0.18)" },
    border: { color: ink },
  };
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
    plugins: [errorBars, seriesLabel],
    data: {
      datasets: [
        {
          label: curve.instrument,
          data: curve.points.map(([t, flux]) => ({ x: t, y: flux })),
          pointRadius: 0,
          pointHoverRadius: 3,
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
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(item) {
              if (item.datasetIndex === 1) {
                return `model  ${item.parsed.y.toFixed(4)}`;
              }
              const err = curve.points[item.dataIndex][2];
              return `${item.parsed.y.toFixed(4)} ± ${err.toFixed(4)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ...axisOptions("time from center of transit (days)"),
          type: "linear",
          min: -0.1,
          max: 0.1,
          ticks: {
            color: ink,
            font,
            stepSize: 0.05,
            callback: (value) => Number(value).toFixed(2),
          },
        },
        y: {
          ...axisOptions("relative flux"),
          min: 0.975,
          max: 1.012,
          ticks: {
            color: ink,
            font,
            stepSize: 0.005,
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
    `${curve.star_id} during transit. ${curve.instrument} relative photometry from ${curve.source}. Time is orbital phase times the ${curve.period_days}-day period. The line is a transit model fit to these points.`;
}

main().catch((error) => {
  document.getElementById("summary").textContent = error.message;
});
