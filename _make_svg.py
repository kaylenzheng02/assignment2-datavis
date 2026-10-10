import json
import os

with open("tres2-lightcurve.json", encoding="utf-8") as f:
    curve = json.load(f)

pts = curve["points"]
model = curve["model"]
W, H, M = 640, 360, 48
xmin, xmax = -0.1, 0.1
ymin, ymax = 0.975, 1.012


def sx(x):
    return M + (x - xmin) / (xmax - xmin) * (W - 2 * M)


def sy(y):
    return H - M - (y - ymin) / (ymax - ymin) * (H - 2 * M)


lines = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="TrES-2 transit light curve">',
    f'<rect width="{W}" height="{H}" fill="white"/>',
    f'<rect x="{M}" y="{M}" width="{W - 2 * M}" height="{H - 2 * M}" fill="none" stroke="black"/>',
]

for i in range(5):
    y = ymin + i * (ymax - ymin) / 4
    lines.append(
        f'<line x1="{M}" y1="{sy(y):.2f}" x2="{W - M}" y2="{sy(y):.2f}" stroke="#ddd"/>'
    )
for i in range(5):
    x = xmin + i * (xmax - xmin) / 4
    lines.append(
        f'<line x1="{sx(x):.2f}" y1="{M}" x2="{sx(x):.2f}" y2="{H - M}" stroke="#ddd"/>'
    )

path = " ".join(f"{sx(x):.2f},{sy(y):.2f}" for x, y in model)
lines.append(f'<polyline fill="none" stroke="black" stroke-width="2" points="{path}"/>')

for x, y, err in pts[::2]:
    cx = sx(x)
    lines.append(
        f'<line x1="{cx:.2f}" y1="{sy(y - err):.2f}" x2="{cx:.2f}" y2="{sy(y + err):.2f}" stroke="black" stroke-width="1"/>'
    )
    lines.append(f'<circle cx="{cx:.2f}" cy="{sy(y):.2f}" r="1.2" fill="black"/>')

lines += [
    f'<text x="{W / 2}" y="{H - 12}" text-anchor="middle" font-family="Geist Sans, sans-serif" font-size="12">time from center of transit (days)</text>',
    f'<text x="14" y="{H / 2}" transform="rotate(-90 14 {H / 2})" text-anchor="middle" font-family="Geist Sans, sans-serif" font-size="12">relative flux</text>',
    f'<text x="{W / 2}" y="22" text-anchor="middle" font-family="Geist Sans, sans-serif" font-size="13" font-weight="600">TrES-2 transit (same data as chart)</text>',
    "</svg>",
]

out = os.path.join("assets", "tres2-transit-lightcurve.svg")
with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))

print("wrote", out, os.path.getsize(out))
