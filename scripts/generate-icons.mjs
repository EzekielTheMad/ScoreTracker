/**
 * One-time icon generation: renders the app die icon to the PNG sizes the
 * manifest and iOS need. Run with `node scripts/generate-icons.mjs`
 * (requires `npm i -D sharp`). Generated PNGs are committed.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// A five-pip die in the app accent color on the app background.
function dieSvg({ size, pad, bg, rounded }) {
  const s = size;
  const r = rounded ? s * 0.18 : 0;
  const inner = s - pad * 2;
  const die = {
    x: pad + inner * 0.14,
    y: pad + inner * 0.14,
    w: inner * 0.72,
    r: inner * 0.13,
  };
  const pip = inner * 0.075;
  const cx = (f) => die.x + die.w * f;
  const cy = (f) => die.y + die.w * f;
  const pips = [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ]
    .map(
      ([fx, fy]) =>
        `<circle cx="${cx(fx)}" cy="${cy(fy)}" r="${pip}" fill="#101014"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
    <rect width="${s}" height="${s}" rx="${r}" fill="${bg}"/>
    <rect x="${die.x}" y="${die.y}" width="${die.w}" height="${die.w}" rx="${die.r}" fill="#f59e0b"/>
    ${pips}
  </svg>`;
}

await mkdir("public/icons", { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, pad: 0, rounded: true },
  { file: "icon-512.png", size: 512, pad: 0, rounded: true },
  // Maskable: keep art inside the 80% safe zone, square full-bleed bg.
  { file: "maskable-512.png", size: 512, pad: 51, rounded: false },
  // iOS home screen icon (iOS applies its own corner mask).
  { file: "apple-touch-icon.png", size: 180, pad: 0, rounded: false },
];

for (const t of targets) {
  const svg = dieSvg({ size: t.size, pad: t.pad, bg: "#101014", rounded: t.rounded });
  await sharp(Buffer.from(svg)).png().toFile(`public/icons/${t.file}`);
  console.log(`wrote public/icons/${t.file}`);
}
