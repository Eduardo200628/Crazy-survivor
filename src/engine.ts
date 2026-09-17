import { UPGRADES, type Upgrade, type UpgradeId } from "./upgrades";

export type Vec = { x: number; y: number };

export type EnemyKind = "walker" | "runner" | "tank";

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

export type Gem = {
  id: number;
  x: number;
  y: number;
  value: number;
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
  invuln: number;
};

export type GameEvent =
  | { type: "levelup" }
  | { type: "kill"; coins: number }
  | { type: "gameover" }
  | { type: "hit" };

export type GameState = {
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
  camX: number;
  camY: number;
  time: number;
  player: Player;
  weapon: Weapon;
  enemies: Enemy[];
  bullets: Bullet[];
  gems: Gem[];
  xp: number;
  xpToNext: number;
  level: number;
  kills: number;
  coins: number;
  spawnTimer: number;
  fireTimer: number;
  idCounter: number;
  shake: number;
  lastAim: Vec;
  upgradeLevels: Partial<Record<UpgradeId, number>>;
};

const PAD = 16;

const ENEMY_STATS: Record<
  EnemyKind,
  { radius: number; hp: number; speed: number; damage: number; coins: number; gems: number }
> = {
  walker: { radius: 16, hp: 22, speed: 75, damage: 15, coins: 1, gems: 1 },
  runner: { radius: 11, hp: 12, speed: 140, damage: 10, coins: 2, gems: 1 },
  tank: { radius: 27, hp: 110, speed: 45, damage: 30, coins: 6, gems: 3 },
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

export function createGame(width: number, height: number): GameState {
  const worldWidth = width * 3;
  const worldHeight = height * 3;
  return {
    width,
    height,
    worldWidth,
    worldHeight,
    camX: worldWidth / 2 - width / 2,
    camY: worldHeight / 2 - height / 2,
    time: 0,
    player: {
      x: worldWidth / 2,
      y: worldHeight / 2,
      radius: 15,
      hp: 100,
      maxHp: 100,
      speed: 215,
      regen: 0,
      magnet: 130,
      invuln: 1,
    },
    weapon: {
      damage: 12,
      fireRate: 3.2,
      bulletSpeed: 460,
      bulletRadius: 4,
      count: 1,
      spread: 0.38,
      pierce: 0,
      critChance: 0,
      critMult: 2.5,
    },
    enemies: [],
    bullets: [],
    gems: [],
    xp: 0,
    xpToNext: 10,
    level: 1,
    kills: 0,
    coins: 0,
    spawnTimer: 0.5,
    fireTimer: 0,
    idCounter: 0,
    shake: 0,
    lastAim: { x: 1, y: 0 },
    upgradeLevels: {},
  };
}

export function scoreOf(state: GameState) {
  return state.kills * 10 + state.level * 50 + Math.floor(state.time);
}

function nearestEnemy(state: GameState): Enemy | null {
  const player = state.player;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const enemy of state.enemies) {
    const d = dist(player, enemy);
    if (d < bestDist) {
      bestDist = d;
      best = enemy;
    }
  }
  return best;
}

function fire(state: GameState, aim: Vec) {
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
}

function weightedKind(state: GameState): EnemyKind {
  const time = state.time;
  const pool: [EnemyKind, number][] = [["walker", 10]];
  if (time > 20) {
    pool.push(["runner", 4]);
  }
  if (time > 45) {
    pool.push(["tank", 3]);
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

function spawnEnemy(state: GameState) {
  if (state.enemies.length >= MAX_ENEMIES) {
    return;
  }

  const kind = weightedKind(state);
  const stats = ENEMY_STATS[kind];
  const spawnDistance = Math.max(state.width, state.height) * 0.7;

  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    x = clamp(
      state.player.x + Math.cos(angle) * spawnDistance,
      PAD,
      state.worldWidth - PAD,
    );
    y = clamp(
      state.player.y + Math.sin(angle) * spawnDistance,
      PAD,
      state.worldHeight - PAD,
    );

    if (dist({ x, y }, state.player) > 90 || attempt === 7) {
      break;
    }
  }

  const difficulty = 1 + state.time / 90;
  const hp = stats.hp * difficulty;

  state.enemies.push({
    id: nextId(state),
    kind,
    x,
    y,
    radius: stats.radius,
    hp,
    maxHp: hp,
    speed: stats.speed * (1 + state.time / 240),
    damage: stats.damage,
    contactCooldown: 0,
    hitFlash: 0,
  });
}

export function updateGame(
  state: GameState,
  dt: number,
  target: Vec | null,
  aimTarget: Vec | null,
) {
  const events: GameEvent[] = [];
  const player = state.player;

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

  if (target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 3) {
      const step = Math.min(distance, player.speed * dt) / distance;
      player.x += dx * step;
      player.y += dy * step;
    }

    player.x = clamp(player.x, PAD + player.radius, state.worldWidth - PAD - player.radius);
    player.y = clamp(player.y, PAD + player.radius, state.worldHeight - PAD - player.radius);
  }

  state.camX = clamp(player.x - state.width / 2, 0, state.worldWidth - state.width);
  state.camY = clamp(player.y - state.height / 2, 0, state.worldHeight - state.height);

  if (player.regen > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  }
  if (player.invuln > 0) {
    player.invuln -= dt;
  }

  const enemyTarget = nearestEnemy(state);
  const aim = enemyTarget
    ? normalize({ x: enemyTarget.x - player.x, y: enemyTarget.y - player.y })
    : state.lastAim;

  state.fireTimer -= dt;
  while (state.fireTimer <= 0) {
    fire(state, aim);
    state.fireTimer += 1 / state.weapon.fireRate;
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

      if (bullet.pierce < 0) {
        bullet.life = 0;
        break;
      }
    }
  }

  const survivingEnemies: Enemy[] = [];
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) {
      state.kills += 1;
      const stats = ENEMY_STATS[enemy.kind];

      for (let i = 0; i < stats.gems; i++) {
        state.gems.push({
          id: nextId(state),
          x: enemy.x + (Math.random() - 0.5) * 26,
          y: enemy.y + (Math.random() - 0.5) * 26,
          value: 1,
        });
      }

      state.coins += stats.coins;
      events.push({ type: "kill", coins: stats.coins });
      continue;
    }

    enemy.contactCooldown -= dt;
    enemy.hitFlash -= dt;

    const dir = normalize({ x: player.x - enemy.x, y: player.y - enemy.y });
    enemy.x += dir.x * enemy.speed * dt;
    enemy.y += dir.y * enemy.speed * dt;

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
    }

    survivingEnemies.push(enemy);
  }
  state.enemies = survivingEnemies;

  state.bullets = state.bullets.filter(
    (bullet) =>
      bullet.life > 0 &&
      bullet.x > -20 &&
      bullet.x < state.worldWidth + 20 &&
      bullet.y > -20 &&
      bullet.y < state.worldHeight + 20,
  );

  const survivingGems: Gem[] = [];
  for (const gem of state.gems) {
    const toPlayer = dist(gem, player);
    if (toPlayer < player.magnet) {
      const dir = normalize({ x: player.x - gem.x, y: player.y - gem.y });
      gem.x += dir.x * 320 * dt;
      gem.y += dir.y * 320 * dt;
    }

    if (toPlayer < player.radius + 9) {
      state.xp += gem.value;
      continue;
    }

    survivingGems.push(gem);
  }
  state.gems = survivingGems;

  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = state.level * 10;
    events.push({ type: "levelup" });
  }

  state.spawnTimer -= dt;
  const spawnInterval = Math.max(0.28, 1.05 / (1 + state.time / 40));
  while (state.spawnTimer <= 0) {
    spawnEnemy(state);
    state.spawnTimer += spawnInterval;
  }

  state.shake = Math.max(0, state.shake - dt * 12);

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