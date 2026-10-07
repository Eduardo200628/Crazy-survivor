import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from "expo-audio";

export type SoundId =
  | "shot"
  | "shotgun"
  | "hit"
  | "kill"
  | "coin"
  | "gem"
  | "levelup"
  | "victory"
  | "defeat"
  | "hurt"
  | "click"
  | "chest"
  | "boss"
  | "nova"
  | "dash";

const SOURCES: Record<SoundId, number> = {
  shot: require("../assets/audio/shot.wav"),
  shotgun: require("../assets/audio/shotgun.wav"),
  hit: require("../assets/audio/hit.wav"),
  kill: require("../assets/audio/kill.wav"),
  coin: require("../assets/audio/coin.wav"),
  gem: require("../assets/audio/gem.wav"),
  levelup: require("../assets/audio/levelup.wav"),
  victory: require("../assets/audio/victory.wav"),
  defeat: require("../assets/audio/defeat.wav"),
  hurt: require("../assets/audio/hurt.wav"),
  click: require("../assets/audio/click.wav"),
  chest: require("../assets/audio/chest.wav"),
  boss: require("../assets/audio/boss.wav"),
  nova: require("../assets/audio/nova.wav"),
  dash: require("../assets/audio/dash.wav"),
};

const MUSIC_SOURCE = require("../assets/audio/music.wav");

const MIN_INTERVAL: Record<SoundId, number> = {
  shot: 0.07,
  shotgun: 0.12,
  hit: 0.05,
  kill: 0.07,
  coin: 0.06,
  gem: 0.06,
  levelup: 0.3,
  victory: 1,
  defeat: 1,
  hurt: 0.25,
  click: 0.04,
  chest: 0.5,
  boss: 1,
  nova: 0.2,
  dash: 0.15,
};

const POOL_SIZE = 4;
const MAX_VOICES = 10;

const pools = new Map<SoundId, ReturnType<typeof createAudioPlayer>[]>();
const cursors = new Map<SoundId, number>();
const lastPlayed = new Map<SoundId, number>();

let sfxVolume = 0.9;
let musicVolume = 0.4;
let musicEnabled = true;
let voices = 0;
let musicPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let ready = false;

function ensurePool(id: SoundId) {
  let pool = pools.get(id);
  if (!pool) {
    pool = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const player = createAudioPlayer(SOURCES[id]);
      player.volume = sfxVolume;
      pool.push(player);
    }
    pools.set(id, pool);
  }
  return pool;
}

export function initAudio() {
  if (ready) {
    return;
  }
  ready = true;
  void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers" });
  musicPlayer = createAudioPlayer(MUSIC_SOURCE);
  musicPlayer.loop = true;
  musicPlayer.volume = musicEnabled ? musicVolume : 0;
  if (musicEnabled) {
    void musicPlayer.play();
  }
}

export function play(id: SoundId) {
  if (!ready) {
    return;
  }
  const now = Date.now() / 1000;
  const previous = lastPlayed.get(id) ?? -Infinity;
  if (now - previous < MIN_INTERVAL[id]) {
    return;
  }
  lastPlayed.set(id, now);
  if (voices >= MAX_VOICES) {
    return;
  }
  const pool = ensurePool(id);
  const cursor = cursors.get(id) ?? 0;
  const player = pool[cursor % pool.length];
  cursors.set(id, cursor + 1);
  player.volume = sfxVolume;
  voices += 1;
  const release = () => {
    voices = Math.max(0, voices - 1);
  };
  try {
    void player.seekTo(0);
    player.play();
  } catch {
    release();
    return;
  }
  setTimeout(release, 220);
}

export function startMusic() {
  if (!ready || !musicPlayer) {
    return;
  }
  if (musicEnabled) {
    try {
      void musicPlayer.play();
    } catch {
      // ignore
    }
  }
}

export function stopMusic() {
  if (!musicPlayer) {
    return;
  }
  try {
    musicPlayer.pause();
  } catch {
    // ignore
  }
}

export function setMusicEnabled(enabled: boolean) {
  musicEnabled = enabled;
  if (musicPlayer) {
    musicPlayer.volume = enabled ? musicVolume : 0;
  }
  if (enabled) {
    startMusic();
  } else {
    stopMusic();
  }
}

export function isMusicEnabled() {
  return musicEnabled;
}

export function setSfxVolume(volume: number) {
  sfxVolume = Math.max(0, Math.min(1, volume));
  if (musicPlayer) {
    musicPlayer.volume = musicEnabled ? musicVolume : 0;
  }
}

export async function setAppActive(active: boolean) {
  try {
    await setIsAudioActiveAsync(active);
  } catch {
    // ignore
  }
  if (active) {
    startMusic();
  } else {
    stopMusic();
  }
}
