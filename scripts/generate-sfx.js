const fs = require("fs");
const path = require("path");

const RATE = 22050;
const OUT = path.join(__dirname, "..", "assets", "audio");

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([header, data]));
  const kb = ((44 + data.length) / 1024).toFixed(1);
  console.log(`${name}.wav  ${kb} KB  ${(samples.length / RATE).toFixed(2)}s`);
}

const tau = Math.PI * 2;
const n = (seconds) => Math.max(1, Math.round(seconds * RATE));

function wave(type, phase) {
  if (type === "square") {
    return phase < 0.5 ? 1 : -1;
  }
  if (type === "saw") {
    return 2 * phase - 1;
  }
  return 2 * Math.abs(2 * phase - 1) - 1;
}

function tone(freq, seconds, opts = {}) {
  const { type = "square", decay = 8, gain = 0.45, vibrato = 0, sweep = 0, seed = 1 } = opts;
  const count = n(seconds);
  const out = new Float32Array(count);
  const rnd = mulberry32(Math.round(freq * 977 + seconds * 7919 + seed * 13));
  for (let i = 0; i < count; i++) {
    const t = i / RATE;
    const f = freq + sweep * t + (vibrato ? Math.sin(t * tau * 17) * vibrato : 0);
    const sample = wave(type, (f * t) % 1);
    out[i] = sample * Math.exp(-t * decay) * gain * (0.94 + 0.06 * rnd());
  }
  return out;
}

function noise(seconds, opts = {}) {
  const { decay = 22, gain = 0.4, lp = 0.5, seed = 7 } = opts;
  const count = n(seconds);
  const out = new Float32Array(count);
  const rnd = mulberry32(Math.round(seconds * 104729 + lp * 613 + seed));
  let last = 0;
  for (let i = 0; i < count; i++) {
    const t = i / RATE;
    const white = rnd() * 2 - 1;
    last = last + lp * (white - last);
    out[i] = last * Math.exp(-t * decay) * gain;
  }
  return out;
}

function mix(...tracks) {
  const length = Math.max(...tracks.map((t) => t.length));
  const out = new Float32Array(length);
  for (const track of tracks) {
    for (let i = 0; i < track.length; i++) {
      out[i] += track[i];
    }
  }
  let peak = 0;
  for (const v of out) {
    peak = Math.max(peak, Math.abs(v));
  }
  if (peak > 0.92) {
    for (let i = 0; i < length; i++) {
      out[i] = (out[i] / peak) * 0.92;
    }
  }
  return out;
}

function place(track, offsetSeconds) {
  const offset = n(offsetSeconds);
  const out = new Float32Array(offset + track.length);
  out.set(track, offset);
  return out;
}

function melody(notes, step, opts = {}) {
  const { gain = 0.3, type = "square", decay = 5, duty = 0.95 } = opts;
  const length = n(notes.length * step + step);
  const out = new Float32Array(length);
  notes.forEach((freq, index) => {
    if (!freq) {
      return;
    }
    const part = tone(freq, step * duty, { type, decay, gain, seed: index });
    const start = n(index * step);
    for (let i = 0; i < part.length && start + i < length; i++) {
      out[start + i] += part[i];
    }
  });
  return out;
}

// --- one shots -------------------------------------------------------------

const shot = mix(
  tone(880, 0.07, { type: "saw", decay: 55, gain: 0.3, sweep: -2600 }),
  noise(0.06, { decay: 70, gain: 0.22, lp: 0.85 }),
);
const shotgun = mix(
  noise(0.22, { decay: 16, gain: 0.4, lp: 0.35 }),
  tone(190, 0.18, { type: "saw", decay: 18, gain: 0.28, sweep: -420 }),
);
const hit = mix(
  noise(0.05, { decay: 60, gain: 0.3, lp: 0.7 }),
  tone(320, 0.05, { type: "square", decay: 50, gain: 0.16, sweep: -180 }),
);
const kill = mix(
  noise(0.16, { decay: 24, gain: 0.34, lp: 0.28 }),
  tone(150, 0.14, { type: "saw", decay: 22, gain: 0.22, sweep: -110 }),
);
const coin = mix(
  tone(1180, 0.05, { decay: 34, gain: 0.24 }),
  place(tone(1760, 0.11, { decay: 20, gain: 0.24 }), 0.045),
);
const gem = mix(
  tone(1320, 0.1, { decay: 16, gain: 0.22 }),
  place(tone(1980, 0.14, { decay: 13, gain: 0.2 }), 0.06),
);
const levelup = melody([523.25, 659.25, 783.99, 1046.5], 0.1, { gain: 0.3, decay: 6 });
const victory = melody([523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5], 0.14, { gain: 0.32, decay: 4 });
const defeat = melody([392, 349.23, 293.66, 220], 0.19, { gain: 0.32, decay: 4.5 });
const hurt = mix(
  tone(220, 0.2, { type: "saw", decay: 14, gain: 0.32, sweep: -150 }),
  noise(0.12, { decay: 26, gain: 0.2, lp: 0.4 }),
);
const click = tone(660, 0.04, { decay: 45, gain: 0.2 });
const chest = mix(
  melody([659.25, 880, 1174.7], 0.08, { gain: 0.26, decay: 8 }),
  noise(0.3, { decay: 9, gain: 0.12, lp: 0.2 }),
);
const bossAlert = mix(
  tone(110, 0.7, { type: "saw", decay: 3.2, gain: 0.3, vibrato: 6 }),
  tone(164.81, 0.7, { type: "square", decay: 3.6, gain: 0.16 }),
);
const nova = mix(
  noise(0.45, { decay: 7, gain: 0.34, lp: 0.18 }),
  tone(70, 0.4, { type: "saw", decay: 8, gain: 0.3, sweep: 90 }),
);
const dash = mix(
  noise(0.22, { decay: 20, gain: 0.26, lp: 0.55 }),
  tone(520, 0.18, { decay: 16, gain: 0.18, sweep: 900 }),
);

// --- music loop ------------------------------------------------------------

const CLOCK = 0.125;
const bassNotes = [110, 110, 110, 110, 98, 98, 98, 98, 87.31, 87.31, 87.31, 87.31, 98, 98, 98, 98];
const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const hatPattern = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
const leadA = [659.25, 0, 659.25, 0, 587.33, 0, 523.25, 0, 659.25, 0, 783.99, 0, 523.25, 0, 440, 0];
const leadB = [523.25, 0, 523.25, 0, 392, 0, 440, 0, 523.25, 0, 659.25, 0, 392, 0, 329.63, 0];

const bassTrack = melody(bassNotes, CLOCK, { gain: 0.3, decay: 3.2 });
const leadTrackA = melody(leadA, CLOCK, { gain: 0.2, decay: 4.5 });
const leadTrackB = melody(leadB, CLOCK, { gain: 0.2, decay: 4.5 });
const kickTrack = melody(kickPattern.map((v) => (v ? 120 : 0)), CLOCK, { gain: 0.42, type: "saw", decay: 20, duty: 0.35 });
const hatTrack = melody(hatPattern.map((v) => (v ? 1 : 0)), CLOCK / 2, { gain: 0.07, decay: 45, duty: 0.3 });
const leadTrack = mix(leadTrackA, leadTrackB);
const music = mix(bassTrack, leadTrack, kickTrack, hatTrack);

fs.mkdirSync(OUT, { recursive: true });
writeWav("shot", shot);
writeWav("shotgun", shotgun);
writeWav("hit", hit);
writeWav("kill", kill);
writeWav("coin", coin);
writeWav("gem", gem);
writeWav("levelup", levelup);
writeWav("victory", victory);
writeWav("defeat", defeat);
writeWav("hurt", hurt);
writeWav("click", click);
writeWav("chest", chest);
writeWav("boss", bossAlert);
writeWav("nova", nova);
writeWav("dash", dash);
writeWav("music", music);
console.log("done");
