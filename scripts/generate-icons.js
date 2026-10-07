const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT = path.join(__dirname, "..", "assets", "items");
const SIZE = 16;
const SCALE = 4;
const W = SIZE * SCALE;
const H = SIZE * SCALE;

function hexToRgba(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    255,
  ];
}

function createBuffer() {
  return new Uint8Array(W * H * 4);
}

function setPixel(buf, x, y, rgba) {
  if (x < 0 || y < 0 || x >= W || y >= H) {
    return;
  }
  const at = (y * W + x) * 4;
  buf[at] = rgba[0];
  buf[at + 1] = rgba[1];
  buf[at + 2] = rgba[2];
  buf[at + 3] = rgba[3];
}

function getPixel(buf, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) {
    return [0, 0, 0, 0];
  }
  const at = (y * W + x) * 4;
  return [buf[at], buf[at + 1], buf[at + 2], buf[at + 3]];
}

function isOpaque(pixel) {
  return pixel[3] > 8;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    255,
  ];
}

function forEachPixel(shape, callback) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (shape(x, y)) {
        callback(x, y);
      }
    }
  }
}

function fillCircle(buf, cx, cy, r, color) {
  const rgba = hexToRgba(color);
  forEachPixel((x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r, (x, y) => setPixel(buf, x, y, rgba));
}

function fillEllipse(buf, cx, cy, rx, ry, color) {
  const rgba = hexToRgba(color);
  forEachPixel((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, (x, y) => setPixel(buf, x, y, rgba));
}

function fillDiamond(buf, cx, cy, rx, ry, color) {
  const rgba = hexToRgba(color);
  forEachPixel(
    (x, y) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1,
    (x, y) => setPixel(buf, x, y, rgba),
  );
}

function fillRect(buf, x0, y0, x1, y1, color) {
  const rgba = hexToRgba(color);
  forEachPixel((x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, (x, y) => setPixel(buf, x, y, rgba));
}

function fillCross(buf, cx, cy, half, thick, color) {
  fillRect(buf, cx - half, cy - thick / 2, cx + half, cy + thick / 2, color);
  fillRect(buf, cx - thick / 2, cy - half, cx + thick / 2, cy + half, color);
}

function shadeVertical(buf, lightHex, darkHex) {
  const light = hexToRgba(lightHex);
  const dark = hexToRgba(darkHex);
  const top = H * 0.15;
  const bottom = H * 0.9;
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, Math.max(0, (y - top) / (bottom - top)));
    const color = mix(light, dark, t);
    for (let x = 0; x < W; x++) {
      if (isOpaque(getPixel(buf, x, y))) {
        setPixel(buf, x, y, color);
      }
    }
  }
}

function addOutline(buf, outlineHex) {
  const outline = hexToRgba(outlineHex);
  const targets = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isOpaque(getPixel(buf, x, y))) {
        continue;
      }
      const neighbors = [
        getPixel(buf, x - 1, y),
        getPixel(buf, x + 1, y),
        getPixel(buf, x, y - 1),
        getPixel(buf, x, y + 1),
      ];
      if (neighbors.some(isOpaque)) {
        targets.push([x, y]);
      }
    }
  }
  for (const [x, y] of targets) {
    setPixel(buf, x, y, outline);
  }
}

function addShine(buf, cx, cy, r, color) {
  const rgba = hexToRgba(color);
  forEachPixel(
    (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r && isOpaque(getPixel(buf, x, y)),
    (x, y) => setPixel(buf, x, y, rgba),
  );
}

function sparkle(buf, cx, cy, color) {
  fillRect(buf, cx - 1, cy - 3, cx + 1, cy + 3, color);
  fillRect(buf, cx - 3, cy - 1, cx + 3, cy + 1, color);
}

function writeSprite(name, buf) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), encodePng(W, H, buf));
  console.log(`${name}.png`);
}

let crcTable = null;
function crc32(buffer) {
  if (!crcTable) {
    crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      raw[rowStart + 1 + x * 4] = pixels[at];
      raw[rowStart + 1 + x * 4 + 1] = pixels[at + 1];
      raw[rowStart + 1 + x * 4 + 2] = pixels[at + 2];
      raw[rowStart + 1 + x * 4 + 3] = pixels[at + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeCoin() {
  const buf = createBuffer();
  fillCircle(buf, W / 2, H / 2, W * 0.36, "#e8a92c");
  shadeVertical(buf, "#ffdf7a", "#b97a12");
  addOutline(buf, "#3a2408");
  addShine(buf, W * 0.36, H * 0.3, W * 0.09, "#fff8d8");
  addShine(buf, W * 0.5, H * 0.52, W * 0.045, "#8a5a08");
  return buf;
}

function makeGem() {
  const buf = createBuffer();
  fillDiamond(buf, W / 2, H / 2, W * 0.36, H * 0.42, "#2fd0bd");
  shadeVertical(buf, "#9dfbe9", "#0f8f83");
  forEachPixel(
    (x, y) => x < W / 2 && y < H / 2 && Math.abs(x - W / 2) / (W * 0.36) + Math.abs(y - H / 2) / (H * 0.42) <= 1,
    (x, y) => setPixel(buf, x, y, hexToRgba("#d6fff5")),
  );
  addOutline(buf, "#08302e");
  sparkle(buf, W * 0.5, H * 0.32, "#ffffff");
  return buf;
}

function makeXp() {
  const buf = createBuffer();
  fillCircle(buf, W / 2, H / 2, W * 0.32, "#6b3fd4");
  shadeVertical(buf, "#c9aaff", "#4a24a8");
  addOutline(buf, "#1d0b45");
  addShine(buf, W * 0.38, H * 0.32, W * 0.08, "#f2e8ff");
  sparkle(buf, W * 0.62, H * 0.62, "#e8dcff");
  return buf;
}

function makeHeal() {
  const buf = createBuffer();
  fillCross(buf, W / 2, H / 2, W * 0.32, W * 0.18, "#e8324f");
  shadeVertical(buf, "#ff8fa3", "#c01534");
  addOutline(buf, "#5c0a20");
  addShine(buf, W * 0.47, H * 0.33, W * 0.035, "#ffe3e9");
  return buf;
}

function makeBomb() {
  const buf = createBuffer();
  fillEllipse(buf, W * 0.5, H * 0.58, W * 0.3, H * 0.3, "#2b3350");
  shadeVertical(buf, "#6b7799", "#1a2036");
  for (let i = 0; i < W * 0.12; i++) {
    setPixel(buf, Math.round(W * 0.5 + i), Math.round(H * 0.28 - i * 0.8), hexToRgba("#6b4a24"));
  }
  addOutline(buf, "#0a0d18");
  addShine(buf, W * 0.4, H * 0.46, W * 0.08, "#aab6d6");
  sparkle(buf, Math.round(W * 0.5 + W * 0.12), Math.round(H * 0.28 - W * 0.096), "#ffd75e");
  return buf;
}

function makeCoinPile() {
  const buf = createBuffer();
  fillCircle(buf, W * 0.64, H * 0.38, W * 0.19, "#e8a92c");
  fillCircle(buf, W * 0.36, H * 0.62, W * 0.19, "#d99b28");
  shadeVertical(buf, "#ffdf7a", "#a86f10");
  addOutline(buf, "#3a2408");
  addShine(buf, W * 0.58, H * 0.28, W * 0.055, "#fff8d8");
  addShine(buf, W * 0.3, H * 0.52, W * 0.05, "#fff1bd");
  return buf;
}

function makeGemBag() {
  const buf = createBuffer();
  fillRect(buf, W * 0.24, H * 0.44, W * 0.76, H * 0.82, "#1c8f86");
  fillDiamond(buf, W * 0.4, H * 0.3, W * 0.1, H * 0.12, "#2fd0bd");
  fillDiamond(buf, W * 0.62, H * 0.26, W * 0.09, H * 0.11, "#7cf5e2");
  shadeVertical(buf, "#5fdfcc", "#0f6f68");
  addOutline(buf, "#08302e");
  addShine(buf, W * 0.34, H * 0.58, W * 0.05, "#bff5ea");
  sparkle(buf, W * 0.4, H * 0.3, "#ffffff");
  return buf;
}

fs.mkdirSync(OUT, { recursive: true });
writeSprite("coin", makeCoin());
writeSprite("gem", makeGem());
writeSprite("xp", makeXp());
writeSprite("heal", makeHeal());
writeSprite("bomb", makeBomb());
writeSprite("coin_pile", makeCoinPile());
writeSprite("gem_bag", makeGemBag());
console.log("done");
