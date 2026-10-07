import {
  characterById,
  stageById,
  weaponById,
  type CharacterId,
  type Stage,
  type StageId,
  type WeaponId,
} from "./catalog";
import type { PerkLevels } from "./perks";
import { perkLevel } from "./perks";
import { UPGRADES, type Upgrade, type UpgradeId } from "./upgrades";

export type Loadout = {
  stageId: StageId;
  weaponId: WeaponId;
  characterId: CharacterId;
};

export type Vec = { x: number; y: number };

export type EnemyKind = "walker" | "runner" | "tank" | "spitter" | "boss";

export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  contactCooldown: number;
  hitFlash: number;
  shootTimer: number;
  minionTimer: number;
};

export type Bullet = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  life: number;
};

export type EnemyShot = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
};

export type DropKind = "xp" | "coin" | "gem";

export type Drop = {
  id: number;
  kind: DropKind;
  x: number;
  y: number;
  value: number;
};

export type Orbital = {
  id: number;
  angle: number;
  radius: number;
  speed: number;
  cooldown: number;
};

export type PickupKind = "heal" | "coins" | "bomb" | "gems";

export type Pickup = {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  life: number;
};

export type Weapon = {
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletRadius: number;
  count: number;
  spread: number;
  pierce: number;
  critChance: number;
  critMult: number;
  nova: number;
  novaRadius: number;
  lifesteal: number;
  thorns: number;
  orbitals: number;
  orbitalDamage: number;
  color: string;
};

export type Afterimage = {
  id: number;
  x: number;
  y: number;
  angle: number;
  life: number;
};

export type Player = {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  regen: number;
  magnet: number;
  vision: number;
  invuln: number;
  dashCooldown: number;
  dashTime: number;
  dashDir: Vec;
};

export type GameEvent =
  | { type: "levelup" }
  | { type: "kill"; coins: number; x: number; y: number }
  | { type: "gameover" }
  | { type: "hit" }
  | { type: "boss" }
  | { type: "stageclear" }
  | { type: "shoot" }
  | { type: "nova" }
  | { type: "impact"; x: number; y: number; damage: number; crit: boolean; killed: boolean }
  | { type: "combo"; count: number }
  | { type: "pickup"; kind: PickupKind };


export type GameState = {
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
  camX: number;
  camY: number;
  time: number;
  stage: Stage;
  cleared: boolean;
  gemsCollected: number;
  player: Player;
  weapon: Weapon;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyShots: EnemyShot[];
  drops: Drop[];
  afterimages: Afterimage[];
  orbitals: Orbital[];
  pickups: Pickup[];
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
  bossKills: number;
  coins: number;
  spawnTimer: number;
  fireTimer: number;
  pickupTimer: number;
  bossTimer: number;
  idCounter: number;
  shake: number;
  hitStop: number;
  combo: number;
  comboTimer: number;
  bestCombo: number;
  lastAim: Vec;
  moveDir: Vec;
  upgradeLevels: Partial<Record<UpgradeId, number>>;
};

const PAD = 16;
const ENEMY_SPEED_SCALE = 50;
const WAVE_DURATION = 20;
const MAX_DROPS = 180;
const CULL_DISTANCE = 1100;
const HITSTOP_ON_IMPACT = 0.015;
const HITSTOP_ON_KILL = 0.05;
const COMBO_WINDOW = 2.4;
const DASH_TIME = 0.18;
const DASH_SPEED = 900;
const DASH_COOLDOWN = 3.2;
const DASH_IFRAMES = 0.32;

const ENEMY_STATS: Record<
  EnemyKind,
  {
    radius: number;
    hp: number;
    speed: number;
    damage: number;
    coins: number;
    xp: number;
    gemChance: number;
    gemValue: number;
    shoot: boolean;
    boss: boolean;
  }
> = {
  walker: { radius: 16, hp: 20, speed: 1.5 * ENEMY_SPEED_SCALE, damage: 5, coins: 2, xp: 1, gemChance: 0.25, gemValue: 1, shoot: false, boss: false },
  runner: { radius: 10, hp: 10, speed: 3 * ENEMY_SPEED_SCALE, damage: 3, coins: 3, xp: 1, gemChance: 0.3, gemValue: 1, shoot: false, boss: false },
  tank: { radius: 27, hp: 150, speed: 0.7 * ENEMY_SPEED_SCALE, damage: 15, coins: 15, xp: 3, gemChance: 0.7, gemValue: 2, shoot: false, boss: false },
  spitter: { radius: 13, hp: 30, speed: 95, damage: 12, coins: 3, xp: 1, gemChance: 0.4, gemValue: 1, shoot: true, boss: false },
  boss: { radius: 42, hp: 1600, speed: 48, damage: 35, coins: 40, xp: 6, gemChance: 1, gemValue: 1, shoot: true, boss: true },
};

const MAX_ENEMIES = 140;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(v: Vec): Vec {
  const length = Math.hypot(v.x, v.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / length, y: v.y / length };
}

function nextId(state: GameState) {
  state.idCounter += 1;
  return state.idCounter;
}

export function createGame(
  width: number,
  height: number,
  perks: PerkLevels = {},
  loadout: Partial<Loadout> = {},
): GameState {
  const worldWidth = width * 3;
  const worldHeight = height * 3;

  const stage = stageById(loadout.stageId ?? "stage1");
  const weaponDef = weaponById(loadout.weaponId ?? "pistol");
  const character = characterById(loadout.characterId ?? "rookie");

  const damageMult = 1 + perkLevel(perks, "damage") * 0.05;
  const speedMult = 1 + perkLevel(perks, "speed") * 0.03;
  const maxHpBonus = perkLevel(perks, "maxhp") * 10;
  const magnetBonus = perkLevel(perks, "magnet") * 10;
  const regenBonus = perkLevel(perks, "regen") * 0.2;
  const maxHp = Math.max(40, 100 + maxHpBonus + character.hpBonus);

  return {
    width,
    height,
    worldWidth,
    worldHeight,
    camX: worldWidth / 2 - width / 2,
    camY: worldHeight / 2 - height / 2,
    time: 0,
    stage,
    cleared: false,
    gemsCollected: 0,
    player: {
      x: worldWidth / 2,
      y: worldHeight / 2,
      radius: 15,
      hp: maxHp,
      maxHp,
      speed: 215 * speedMult * character.speedMult,
      regen: regenBonus + character.regenBonus,
      magnet: 130 + magnetBonus,
      vision: 280,
      invuln: 1,
      dashCooldown: 0,
      dashTime: 0,
      dashDir: { x: 1, y: 0 },
    },
    weapon: {
      damage: weaponDef.stats.damage * damageMult,
      fireRate: weaponDef.stats.fireRate,
      bulletSpeed: weaponDef.stats.bulletSpeed,
      bulletRadius: weaponDef.stats.bulletRadius,
      count: weaponDef.stats.count,
      spread: weaponDef.stats.spread,
      pierce: weaponDef.stats.pierce,
      critChance: 0,
      critMult: 2.5,
      nova: 0,
      novaRadius: 0,
      lifesteal: 0,
      thorns: 0,
      orbitals: 0,
      orbitalDamage: 0,
      color: weaponDef.color,
    },
    enemies: [],
    bullets: [],
    enemyShots: [],
    drops: [],
    afterimages: [],
    orbitals: [],
    pickups: [],
    xp: 0,
    xpToNext: 10,
    level: 1,
    kills: 0,
    bossKills: 0,
    coins: 0,
    spawnTimer: 0.5,
    fireTimer: 0,
    pickupTimer: 14,
    bossTimer: Math.max(20, stage.duration * 0.55),
    idCounter: 0,
    shake: 0,
    hitStop: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    lastAim: { x: 1, y: 0 },
    moveDir: { x: 1, y: 0 },
    upgradeLevels: {},
  };
}

export function scoreOf(state: GameState) {
  return state.kills * 10 + state.bossKills * 300 + state.level * 50 + Math.floor(state.time);
}

function nearestEnemy(state: GameState, maxDistance: number): Enemy | null {
  const player = state.player;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const enemy of state.enemies) {
    const d = dist(player, enemy);
    if (d < bestDist && d <= maxDistance) {
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

function fire(state: GameState, aim: Vec, events: GameEvent[]) {
  const { weapon, player } = state;
  const baseAngle = Math.atan2(aim.y, aim.x);
  const count = weapon.count;

  for (let i = 0; i < count; i++) {
    let angle = baseAngle;
    if (count > 1) {
      angle += weapon.spread * (i / (count - 1) - 0.5);
    }

    state.bullets.push({
      id: nextId(state),
      x: player.x + Math.cos(baseAngle) * (player.radius + 6),
      y: player.y + Math.sin(baseAngle) * (player.radius + 6),
      vx: Math.cos(angle) * weapon.bulletSpeed,
      vy: Math.sin(angle) * weapon.bulletSpeed,
      radius: weapon.bulletRadius,
      damage: weapon.damage,
      pierce: weapon.pierce,
      life: 1.4,
    });
  }

  events.push({ type: "shoot" });
}

type SpawnEdge = "left" | "right" | "top" | "bottom";

function edgeSpawnPosition(state: GameState, radius: number): Vec {
  const safeOffset = 4;
  const edgeOffset = radius + safeOffset;
  const min = PAD + radius;
  const maxX = state.worldWidth - min;
  const maxY = state.worldHeight - min;
  const edges: SpawnEdge[] = [];

  if (state.camX - edgeOffset >= min) {
    edges.push("left");
  }
  if (state.camX + state.width + edgeOffset <= maxX) {
    edges.push("right");
  }
  if (state.camY - edgeOffset >= min) {
    edges.push("top");
  }
  if (state.camY + state.height + edgeOffset <= maxY) {
    edges.push("bottom");
  }

  const edge = edges[Math.floor(Math.random() * edges.length)];
  if (edge === "left") {
    return {
      x: state.camX - edgeOffset,
      y: clamp(state.camY + Math.random() * state.height, min, maxY),
    };
  }
  if (edge === "right") {
    return {
      x: state.camX + state.width + edgeOffset,
      y: clamp(state.camY + Math.random() * state.height, min, maxY),
    };
  }
  if (edge === "top") {
    return {
      x: clamp(state.camX + Math.random() * state.width, min, maxX),
      y: state.camY - edgeOffset,
    };
  }
  if (edge === "bottom") {
    return {
      x: clamp(state.camX + Math.random() * state.width, min, maxX),
      y: state.camY + state.height + edgeOffset,
    };
  }

  return {
    x: state.player.x < state.worldWidth / 2 ? maxX : min,
    y: state.player.y < state.worldHeight / 2 ? maxY : min,
  };
}

function weightedKind(state: GameState): EnemyKind {
  const wave = Math.floor(state.time / WAVE_DURATION) + 1;
  const pool: [EnemyKind, number][] = [["walker", 10]];

  if (wave >= 2) {
    pool.push(["runner", Math.min(8, 2 + (wave - 2) * 2)]);
  }
  if (state.time > 30) {
    pool.push(["spitter", 3]);
  }
  if (wave >= 4) {
    pool.push(["tank", Math.min(3, wave - 3)]);
  }

  const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [kind, weight] of pool) {
    roll -= weight;
    if (roll <= 0) {
      return kind;
    }
  }
  return "walker";
}

function spawnEnemy(state: GameState, forcedKind?: EnemyKind) {
  if (state.enemies.length >= MAX_ENEMIES) {
    return;
  }

  const kind = forcedKind ?? weightedKind(state);
  const stats = ENEMY_STATS[kind];
  const position = edgeSpawnPosition(state, stats.radius);
  const difficulty = (1 + state.time / 90) * state.stage.difficulty;
  const hp = stats.hp * difficulty;

  state.enemies.push({
    id: nextId(state),
    kind,
    x: position.x,
    y: position.y,
    radius: stats.radius,
    hp,
    maxHp: hp,
    speed: stats.speed * (1 + state.time / 240),
    damage: stats.damage * state.stage.difficulty,
    contactCooldown: 0,
    hitFlash: 0,
    shootTimer: 1.5 + Math.random() * 2,
    minionTimer: 4,
  });
}

function spawnBoss(state: GameState) {
  const hasBoss = state.enemies.some((enemy) => enemy.kind === "boss");
  if (hasBoss) {
    state.bossTimer = 6;
    return;
  }
  spawnEnemy(state, "boss");
}

function isCulled(enemy: Enemy, distance: number) {
  if (enemy.kind === "boss" || enemy.kind === "tank") {
    return false;
  }
  return distance > CULL_DISTANCE;
}

function dropRewards(state: GameState, enemy: Enemy, events: GameEvent[]) {
  state.kills += 1;
  const stats = ENEMY_STATS[enemy.kind];
  if (stats.boss) {
    state.bossKills += 1;
  }

  state.combo += 1;
  state.comboTimer = COMBO_WINDOW;
  if (state.combo > state.bestCombo) {
    state.bestCombo = state.combo;
  }
  if (state.combo > 1) {
    events.push({ type: "combo", count: state.combo });
  }

  const scatter = (spread: number) => (Math.random() - 0.5) * spread;

  for (let i = 0; i < stats.xp; i++) {
    state.drops.push({
      id: nextId(state),
      kind: "xp",
      x: enemy.x + scatter(26),
      y: enemy.y + scatter(26),
      value: 1,
    });
  }

  const coinCount = Math.min(stats.coins, 5);
  const coinValue = Math.max(1, Math.round(stats.coins / coinCount));
  for (let i = 0; i < coinCount; i++) {
    state.drops.push({
      id: nextId(state),
      kind: "coin",
      x: enemy.x + scatter(34),
      y: enemy.y + scatter(34),
      value: coinValue,
    });
  }

  const gemCount = stats.boss ? 8 : Math.random() < stats.gemChance ? stats.gemValue : 0;
  for (let i = 0; i < gemCount; i++) {
    state.drops.push({
      id: nextId(state),
      kind: "gem",
      x: enemy.x + scatter(44),
      y: enemy.y + scatter(44),
      value: 1,
    });
  }

  const lifesteal = state.weapon.lifesteal;
  if (lifesteal > 0) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + lifesteal);
  }

  state.shake = Math.max(state.shake, stats.boss ? 9 : 3.5);
  events.push({ type: "kill", coins: stats.coins, x: enemy.x, y: enemy.y });
}

function collectDrop(state: GameState, drop: Drop) {
  if (drop.kind === "xp") {
    state.xp += drop.value;
  } else if (drop.kind === "coin") {
    state.coins += drop.value;
  } else {
    state.gemsCollected += drop.value;
  }
}

function spawnPickup(state: GameState) {
  if (state.pickups.length >= 6) {
    state.pickups.shift();
  }

  const kinds: PickupKind[] = ["heal", "coins", "bomb", "gems"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];

  const x = clamp(
    state.camX + state.width * (0.15 + Math.random() * 0.7),
    PAD,
    state.worldWidth - PAD,
  );
  const y = clamp(
    state.camY + state.height * (0.15 + Math.random() * 0.7),
    PAD,
    state.worldHeight - PAD,
  );

  state.pickups.push({ id: nextId(state), kind, x, y, life: 30 });
}

function collectPickup(state: GameState, pickup: Pickup, events: GameEvent[]) {
  const player = state.player;

  switch (pickup.kind) {
    case "heal":
      player.hp = Math.min(player.maxHp, player.hp + 35);
      break;
    case "coins":
      state.coins += 25;
      break;
    case "bomb": {
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0) {
          continue;
        }
        enemy.hp -= enemy.maxHp * 0.4;
        enemy.hitFlash = 0.15;
      }
      break;
    }
    case "gems":
      for (const drop of state.drops) {
        collectDrop(state, drop);
      }
      state.drops.length = 0;
      break;
  }

  events.push({ type: "pickup", kind: pickup.kind });
}

export function updateGame(
  state: GameState,
  dt: number,
  target: Vec | null,
  aimTarget: Vec | null,
) {
  const events: GameEvent[] = [];
  const player = state.player;

  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - dt);
    return events;
  }

  state.time += dt;

  if (aimTarget) {
    const dir = normalize({
      x: aimTarget.x - player.x,
      y: aimTarget.y - player.y,
    });
    if (dir.x !== 0 || dir.y !== 0) {
      state.lastAim = dir;
    }
  }

  if (player.dashTime > 0) {
    player.dashTime = Math.max(0, player.dashTime - dt);
    player.x += player.dashDir.x * DASH_SPEED * dt;
    player.y += player.dashDir.y * DASH_SPEED * dt;
    player.invuln = Math.max(player.invuln, DASH_IFRAMES * 0.4);
    if (state.afterimages.length === 0 || state.afterimages[state.afterimages.length - 1].life < 0.045) {
      state.afterimages.push({
        id: nextId(state),
        x: player.x,
        y: player.y,
        angle: Math.atan2(player.dashDir.y, player.dashDir.x),
        life: 0.28,
      });
    }
  } else if (target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 3) {
      state.moveDir = { x: dx / distance, y: dy / distance };
      const step = Math.min(distance, player.speed * dt) / distance;
      player.x += dx * step;
      player.y += dy * step;
    }

    player.x = clamp(player.x, PAD + player.radius, state.worldWidth - PAD - player.radius);
    player.y = clamp(player.y, PAD + player.radius, state.worldHeight - PAD - player.radius);
  }

  if (player.dashCooldown > 0) {
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  }

  for (const ghost of state.afterimages) {
    ghost.life -= dt;
  }
  state.afterimages = state.afterimages.filter((ghost) => ghost.life > 0);

  state.camX = clamp(player.x - state.width / 2, 0, state.worldWidth - state.width);
  state.camY = clamp(player.y - state.height / 2, 0, state.worldHeight - state.height);

  if (player.regen > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  }
  if (player.invuln > 0) {
    player.invuln -= dt;
  }

  const enemyTarget = nearestEnemy(state, player.vision);
  const aim = enemyTarget
    ? normalize({ x: enemyTarget.x - player.x, y: enemyTarget.y - player.y })
    : state.lastAim;

  if (enemyTarget) {
    state.fireTimer -= dt;
    while (state.fireTimer <= 0) {
      fire(state, aim, events);
      state.fireTimer += 1 / state.weapon.fireRate;
    }
  } else {
    state.fireTimer = 0;
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  for (const bullet of state.bullets) {
    if (bullet.life <= 0) {
      continue;
    }
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }
      const hit = dist(bullet, enemy) < bullet.radius + enemy.radius;
      if (!hit) {
        continue;
      }

      const isCrit = Math.random() < state.weapon.critChance;
      const damage = bullet.damage * (isCrit ? state.weapon.critMult : 1);
      enemy.hp -= damage;
      enemy.hitFlash = 0.08;
      bullet.pierce -= 1;

      const killed = enemy.hp <= 0;
      state.hitStop = Math.max(state.hitStop, killed ? HITSTOP_ON_KILL : HITSTOP_ON_IMPACT);
      events.push({
        type: "impact",
        x: enemy.x,
        y: enemy.y - enemy.radius,
        damage: Math.round(damage),
        crit: isCrit,
        killed,
      });

      if (bullet.pierce < 0) {
        bullet.life = 0;
        break;
      }
    }
  }

  for (const shot of state.enemyShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;

    if (
      shot.life > 0 &&
      dist(shot, player) < shot.radius + player.radius &&
      player.invuln <= 0
    ) {
      player.hp -= shot.damage;
      player.invuln = 0.5;
      state.shake = 4;
      shot.life = 0;
      events.push({ type: "hit" });
    }
  }
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0);

  for (const orbital of state.orbitals) {
    orbital.angle += orbital.speed * dt;
    orbital.cooldown -= dt;
    if (orbital.cooldown > 0) {
      continue;
    }
    const ox = player.x + Math.cos(orbital.angle) * orbital.radius;
    const oy = player.y + Math.sin(orbital.angle) * orbital.radius;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) {
        continue;
      }
      if (dist({ x: ox, y: oy }, enemy) < 14 + enemy.radius) {
        enemy.hp -= state.weapon.orbitalDamage;
        enemy.hitFlash = 0.08;
        orbital.cooldown = 0.35;
        break;
      }
    }
  }

  const survivingEnemies: Enemy[] = [];
  const killPoints: Vec[] = [];

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      dropRewards(state, enemy, events);
      killPoints.push({ x: enemy.x, y: enemy.y });
      continue;
    }

    enemy.contactCooldown -= dt;
    enemy.hitFlash -= dt;
    enemy.shootTimer -= dt;

    if (isCulled(enemy, dist(enemy, player))) {
      continue;
    }

    const dirToPlayer = normalize({ x: player.x - enemy.x, y: player.y - enemy.y });
    enemy.x += dirToPlayer.x * enemy.speed * dt;
    enemy.y += dirToPlayer.y * enemy.speed * dt;

    const stats = ENEMY_STATS[enemy.kind];

    if (enemy.kind === "boss") {
      enemy.minionTimer -= dt;
      if (enemy.minionTimer <= 0) {
        enemy.minionTimer = 5;
        if (state.enemies.length < MAX_ENEMIES - 4) {
          for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const mx = clamp(enemy.x + Math.cos(angle) * 60, PAD, state.worldWidth - PAD);
            const my = clamp(enemy.y + Math.sin(angle) * 60, PAD, state.worldHeight - PAD);
            const difficulty = (1 + state.time / 90) * state.stage.difficulty;
            state.enemies.push({
              id: nextId(state),
              kind: "walker",
              x: mx,
              y: my,
              radius: ENEMY_STATS.walker.radius,
              hp: ENEMY_STATS.walker.hp * difficulty,
              maxHp: ENEMY_STATS.walker.hp * difficulty,
              speed: ENEMY_STATS.walker.speed * (1 + state.time / 240),
              damage: ENEMY_STATS.walker.damage * state.stage.difficulty,
              contactCooldown: 0,
              hitFlash: 0,
              shootTimer: 1.5,
              minionTimer: 0,
            });
          }
        }
      }
    }

    if (stats.shoot && enemy.shootTimer <= 0) {
      const range = stats.boss ? 520 : 430;
      if (dist(enemy, player) < range) {
        if (stats.boss) {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + state.time;
            state.enemyShots.push({
              id: nextId(state),
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 190,
              vy: Math.sin(angle) * 190,
              radius: 6,
              damage: 14,
              life: 3,
            });
          }
        } else {
          const bulletDir = normalize({
            x: player.x - enemy.x,
            y: player.y - enemy.y,
          });
          state.enemyShots.push({
            id: nextId(state),
            x: enemy.x,
            y: enemy.y,
            vx: bulletDir.x * 220,
            vy: bulletDir.y * 220,
            radius: 4,
            damage: 10,
            life: 3,
          });
        }
        enemy.shootTimer = stats.boss ? 4 : 2.2;
      }
    }

    if (
      dist(enemy, player) < enemy.radius + player.radius &&
      player.invuln <= 0 &&
      enemy.contactCooldown <= 0
    ) {
      player.hp -= enemy.damage;
      player.invuln = 0.6;
      enemy.contactCooldown = 0.7;
      state.shake = 5;
      events.push({ type: "hit" });

      const thorns = state.weapon.thorns;
      if (thorns > 0) {
        enemy.hp -= thorns;
        enemy.hitFlash = 0.1;
        if (enemy.hp <= 0) {
          dropRewards(state, enemy, events);
          killPoints.push({ x: enemy.x, y: enemy.y });
          continue;
        }
      }
    }

    survivingEnemies.push(enemy);
  }

  if (state.weapon.nova > 0) {
    const nova = state.weapon.nova;
    const novaRadius = state.weapon.novaRadius;
    if (novaRadius > 0) {
      for (const point of killPoints) {
        for (const enemy of survivingEnemies) {
          if (enemy.hp <= 0) {
            continue;
          }
          if (dist(point, enemy) < novaRadius) {
            enemy.hp -= nova;
            enemy.hitFlash = 0.1;
            state.shake = Math.max(state.shake, 4);
            events.push({ type: "nova" });
          }
        }
      }
    }
  }

  const afterNova: Enemy[] = [];
  for (const enemy of survivingEnemies) {
    if (enemy.hp <= 0) {
      dropRewards(state, enemy, events);
      continue;
    }
    afterNova.push(enemy);
  }
  state.enemies = afterNova;

  state.bullets = state.bullets.filter(
    (bullet) =>
      bullet.life > 0 &&
      bullet.x > -20 &&
      bullet.x < state.worldWidth + 20 &&
      bullet.y > -20 &&
      bullet.y < state.worldHeight + 20,
  );

  const survivingDrops: Drop[] = [];
  for (const drop of state.drops) {
    const toPlayer = dist(drop, player);
    if (toPlayer < player.magnet) {
      const dir = normalize({ x: player.x - drop.x, y: player.y - drop.y });
      drop.x += dir.x * 320 * dt;
      drop.y += dir.y * 320 * dt;
    }

    if (toPlayer < player.radius + 9) {
      collectDrop(state, drop);
      continue;
    }

    survivingDrops.push(drop);
  }

  if (survivingDrops.length > MAX_DROPS) {
    const keepXp = survivingDrops.filter((drop) => drop.kind === "xp");
    const rest = survivingDrops
      .filter((drop) => drop.kind !== "xp")
      .sort((a, b) => dist(b, player) - dist(a, player));
    const room = Math.max(0, MAX_DROPS - keepXp.length);
    survivingDrops.length = 0;
    survivingDrops.push(...keepXp, ...rest.slice(0, room));
  }

  state.drops = survivingDrops;

  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = state.level * 10;
    events.push({ type: "levelup" });
  }

  const survivingPickups: Pickup[] = [];
  for (const pickup of state.pickups) {
    pickup.life -= dt;
    if (pickup.life <= 0) {
      continue;
    }

    const toPlayer = dist(pickup, player);
    if (toPlayer < player.magnet && pickup.kind !== "bomb") {
      const dir = normalize({ x: player.x - pickup.x, y: player.y - pickup.y });
      pickup.x += dir.x * 260 * dt;
      pickup.y += dir.y * 260 * dt;
    }

    if (toPlayer < player.radius + 14) {
      collectPickup(state, pickup, events);
      continue;
    }

    survivingPickups.push(pickup);
  }
  state.pickups = survivingPickups;

  state.pickupTimer -= dt;
  if (state.pickupTimer <= 0) {
    spawnPickup(state);
    state.pickupTimer = 15;
  }

  state.bossTimer -= dt;
  if (state.bossTimer <= 0) {
    const hasBoss = state.enemies.some((enemy) => enemy.kind === "boss");
    if (!hasBoss) {
      spawnBoss(state);
      events.push({ type: "boss" });
    }
    state.bossTimer = 9999;
  }

  state.spawnTimer -= dt;
  const spawnInterval = Math.max(0.28, 1.05 / (1 + state.time / 40));
  while (state.spawnTimer <= 0) {
    spawnEnemy(state);
    state.spawnTimer += spawnInterval;
  }

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 0;
    }
  }

  state.shake = Math.max(0, state.shake - dt * 12);

  if (!state.cleared && state.time >= state.stage.duration) {
    state.cleared = true;
    events.push({ type: "stageclear" });
  }

  if (player.hp <= 0) {
    player.hp = 0;
    events.push({ type: "gameover" });
  }

  return events;
}

export function applyUpgrade(state: GameState, id: UpgradeId) {
  const player = state.player;
  const weapon = state.weapon;

  state.upgradeLevels[id] = (state.upgradeLevels[id] ?? 0) + 1;

  switch (id) {
    case "damage":
      weapon.damage *= 1.2;
      break;
    case "rapid":
      weapon.fireRate *= 1.2;
      break;
    case "multishot":
      weapon.count += 1;
      break;
    case "pierce":
      weapon.pierce += 1;
      break;
    case "speed":
      player.speed *= 1.12;
      break;
    case "maxhp":
      player.maxHp += 20;
      player.hp = Math.min(player.maxHp, player.hp + 20);
      break;
    case "magnet":
      player.magnet *= 1.3;
      break;
    case "regen":
      player.regen += 1;
      break;
    case "bulletSpeed":
      weapon.bulletSpeed *= 1.15;
      break;
    case "crit":
      weapon.critChance += 0.1;
      weapon.critMult = 2.5;
      break;
    case "heal":
      player.hp = player.maxHp;
      break;
    case "nova":
      weapon.nova += 18;
      weapon.novaRadius += 70;
      break;
    case "lifesteal":
      weapon.lifesteal += 1.5;
      break;
    case "thorns":
      weapon.thorns += 12;
      break;
    case "orbital":
      weapon.orbitals += 1;
      weapon.orbitalDamage += 22;
      state.orbitals.push({
        id: nextId(state),
        angle: Math.random() * Math.PI * 2,
        radius: 52,
        speed: 4,
        cooldown: 0,
      });
      break;
  }
}

export function pickUpgradeChoices(state: GameState): Upgrade[] {
  const used = state.upgradeLevels;

  const available = UPGRADES.filter((upgrade) => {
    const current = used[upgrade.id] ?? 0;
    return current < upgrade.max;
  });

  const picks: Upgrade[] = [];

  while (picks.length < 3 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length);
    const [picked] = available.splice(index, 1);
    picks.push(picked);
  }

  return picks;
}

export function revivePlayer(state: GameState) {
  state.player.hp = state.player.maxHp * 0.6;
  state.player.invuln = 2;
}

export function dashPlayer(state: GameState) {
  const player = state.player;
  if (player.dashCooldown > 0 || player.dashTime > 0) {
    return false;
  }
  const dir = state.moveDir;
  player.dashDir =
    dir.x === 0 && dir.y === 0 ? state.lastAim : { x: dir.x, y: dir.y };
  player.dashTime = DASH_TIME;
  player.dashCooldown = DASH_COOLDOWN;
  player.invuln = Math.max(player.invuln, DASH_IFRAMES);
  state.afterimages.push({
    id: nextId(state),
    x: player.x,
    y: player.y,
    angle: Math.atan2(player.dashDir.y, player.dashDir.x),
    life: 0.28,
  });
  return true;
}

export const DASH_DURATION = DASH_COOLDOWN;