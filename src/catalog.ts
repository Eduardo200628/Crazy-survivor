export type StageId = "stage1" | "stage2" | "stage3" | "stage4" | "stage5";

export type Stage = {
  id: StageId;
  name: string;
  subtitle: string;
  duration: number;
  difficulty: number;
  rewardCoins: number;
  rewardGems: number;
  accent: string;
};

export const STAGES: Stage[] = [
  {
    id: "stage1",
    name: "Patio Trasero",
    subtitle: "Primer contacto",
    duration: 60,
    difficulty: 1,
    rewardCoins: 40,
    rewardGems: 6,
    accent: "#56f0c4",
  },
  {
    id: "stage2",
    name: "Almacen",
    subtitle: "No estan solos",
    duration: 75,
    difficulty: 1.3,
    rewardCoins: 60,
    rewardGems: 9,
    accent: "#ffd166",
  },
  {
    id: "stage3",
    name: "Suelo 3",
    subtitle: "Disparos enemigos",
    duration: 90,
    difficulty: 1.7,
    rewardCoins: 85,
    rewardGems: 13,
    accent: "#ff9f43",
  },
  {
    id: "stage4",
    name: "Azotea",
    subtitle: "Aguanta la presion",
    duration: 105,
    difficulty: 2.2,
    rewardCoins: 120,
    rewardGems: 18,
    accent: "#ff4dd2",
  },
  {
    id: "stage5",
    name: "Nucleo",
    subtitle: "Zona final",
    duration: 120,
    difficulty: 2.9,
    rewardCoins: 170,
    rewardGems: 25,
    accent: "#a06bff",
  },
];

export function stageById(id: StageId): Stage {
  return STAGES.find((stage) => stage.id === id) ?? STAGES[0];
}

export function stageIndex(id: StageId): number {
  return Math.max(0, STAGES.findIndex((stage) => stage.id === id));
}

export type WeaponId = "pistol" | "shotgun" | "smg" | "railgun";

export type WeaponStats = {
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletRadius: number;
  count: number;
  spread: number;
  pierce: number;
};

export type WeaponDef = {
  id: WeaponId;
  label: string;
  description: string;
  cost: number;
  color: string;
  stats: WeaponStats;
};

export const WEAPONS: WeaponDef[] = [
  {
    id: "pistol",
    label: "Pistola",
    description: "Equilibrada y precisa",
    cost: 0,
    color: "#ffd166",
    stats: {
      damage: 12,
      fireRate: 3.2,
      bulletSpeed: 460,
      bulletRadius: 4,
      count: 1,
      spread: 0.38,
      pierce: 0,
    },
  },
  {
    id: "shotgun",
    label: "Escopeta",
    description: "4 perdigones por disparo",
    cost: 180,
    color: "#ff8c42",
    stats: {
      damage: 9,
      fireRate: 1.5,
      bulletSpeed: 420,
      bulletRadius: 5,
      count: 4,
      spread: 0.55,
      pierce: 0,
    },
  },
  {
    id: "smg",
    label: "Subfusil",
    description: "Cadencia muy alta",
    cost: 320,
    color: "#5eead4",
    stats: {
      damage: 7,
      fireRate: 8,
      bulletSpeed: 500,
      bulletRadius: 3,
      count: 1,
      spread: 0.3,
      pierce: 0,
    },
  },
  {
    id: "railgun",
    label: "Riel",
    description: "Atraviesa enemigos",
    cost: 600,
    color: "#a06bff",
    stats: {
      damage: 34,
      fireRate: 1.1,
      bulletSpeed: 900,
      bulletRadius: 6,
      count: 1,
      spread: 0,
      pierce: 2,
    },
  },
];

export function weaponById(id: WeaponId): WeaponDef {
  return WEAPONS.find((weapon) => weapon.id === id) ?? WEAPONS[0];
}

export type CharacterId = "rookie" | "brute" | "ghost";

export type CharacterDef = {
  id: CharacterId;
  label: string;
  description: string;
  cost: number;
  hpBonus: number;
  speedMult: number;
  regenBonus: number;
  accent: string;
  passive: string;
};

export const CHARACTERS: CharacterDef[] = [
  {
    id: "rookie",
    label: "Recluta",
    description: "El equilibrio perfecto",
    cost: 0,
    hpBonus: 0,
    speedMult: 1,
    regenBonus: 0,
    accent: "#56f0c4",
    passive: "Barrera temporal",
  },
  {
    id: "brute",
    label: "Bruto",
    description: "+60 vida, mas lento",
    cost: 220,
    hpBonus: 60,
    speedMult: 0.88,
    regenBonus: 0,
    accent: "#ff9f43",
    passive: "Piel de acero",
  },
  {
    id: "ghost",
    label: "Fantasma",
    description: "+18% velocidad, -20 vida",
    cost: 300,
    hpBonus: -20,
    speedMult: 1.18,
    regenBonus: 0.6,
    accent: "#a06bff",
    passive: "Paso etereo",
  },
];

export function characterById(id: CharacterId): CharacterDef {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}

export function starsOfCost(cost: number): number {
  if (cost <= 0) {
    return 1;
  }
  return Math.max(1, Math.min(3, Math.ceil(cost / 200)));
}

export function levelOfCost(cost: number): number {
  return 1 + (starsOfCost(cost) - 1) * 2;
}

export type DiamondPackId = "d500" | "d2000" | "d6000";

export type DiamondPack = {
  id: DiamondPackId;
  label: string;
  gems: number;
  priceLabel: string;
  storeId: string;
};

export const DIAMOND_PACKS: DiamondPack[] = [
  { id: "d500", label: "X500", gems: 500, priceLabel: "2,99 €", storeId: "cs_gems_500" },
  { id: "d2000", label: "X2000", gems: 2000, priceLabel: "9,99 €", storeId: "cs_gems_2000" },
  { id: "d6000", label: "X6000", gems: 6000, priceLabel: "24,99 €", storeId: "cs_gems_6000" },
];

export function diamondPackById(id: DiamondPackId): DiamondPack | undefined {
  return DIAMOND_PACKS.find((pack) => pack.id === id);
}

export function diamondPackByStoreId(storeId: string): DiamondPack | undefined {
  return DIAMOND_PACKS.find((pack) => pack.storeId === storeId);
}

export type GoldOfferId = "g_free" | "g5000" | "g10k";

export type GoldOffer = {
  id: GoldOfferId;
  label: string;
  coins: number;
  gems: number;
  ad: boolean;
};

export const GOLD_OFFERS: GoldOffer[] = [
  { id: "g_free", label: "X1000", coins: 1000, gems: 0, ad: true },
  { id: "g5000", label: "X5000", coins: 5000, gems: 50, ad: false },
  { id: "g10k", label: "X10K", coins: 10000, gems: 100, ad: false },
];

export type ChestId = "silver" | "hero" | "weapon";

export type ChestDef = {
  id: ChestId;
  gems: number;
  coins: [min: number, max: number];
};

export const CHESTS: ChestDef[] = [
  { id: "silver", gems: 100, coins: [200, 400] },
  { id: "hero", gems: 300, coins: [500, 900] },
  { id: "weapon", gems: 300, coins: [500, 900] },
];

export function chestById(id: ChestId): ChestDef {
  return CHESTS.find((chest) => chest.id === id) ?? CHESTS[0];
}

export const CHEST_PACK_SIZE = 10;

export const CHEST_PACK_DISCOUNT = 0.9;

export type HubIcon =
  | "cart"
  | "helmet"
  | "map"
  | "rifle"
  | "dna"
  | "book"
  | "coin"
  | "ammo"
  | "sparkle";

export type HubTabId = "shop" | "hero" | "level" | "armament" | "talents";

export type HubTab = {
  id: HubTabId;
  label: string;
  icon: HubIcon;
};

export const HUB_TABS: HubTab[] = [
  { id: "shop", label: "Tienda", icon: "cart" },
  { id: "hero", label: "Heroe", icon: "helmet" },
  { id: "level", label: "Nivel", icon: "map" },
  { id: "armament", label: "Armas", icon: "rifle" },
  { id: "talents", label: "Talentos", icon: "dna" },
];

export type StageNodeId = "phase1" | "phase2" | "phase3";

export type StageNode = {
  id: StageNodeId;
  label: string;
  detail: string;
  gems: number;
  coins: number;
};

export const STAGE_NODES: StageNode[] = [
  { id: "phase1", label: "Fase 1", detail: "Aproximacion", gems: 2, coins: 10 },
  { id: "phase2", label: "Fase 2", detail: "Refuerzos", gems: 3, coins: 15 },
  { id: "phase3", label: "Fase 3", detail: "Jefe", gems: 5, coins: 25 },
];

export type StageNodeState = "done" | "active" | "locked";

export function stageNodeStates(id: StageId, cleared: number): StageNodeState[] {
  const index = stageIndex(id);
  if (index < cleared) {
    return ["done", "done", "done"];
  }
  if (index === cleared) {
    return ["active", "locked", "locked"];
  }
  return ["locked", "locked", "locked"];
}

export type RewardIcon = "book" | "coin" | "ammo";

export type RewardItem = {
  id: "exp" | "coins" | "ammo";
  label: string;
  amount: number;
  icon: RewardIcon;
};

export function stageRewards(stage: Stage): RewardItem[] {
  return [
    { id: "exp", label: "Libros EXP", amount: Math.round(120 * stage.difficulty), icon: "book" },
    { id: "coins", label: "Monedas", amount: stage.rewardCoins, icon: "coin" },
    { id: "ammo", label: "Municion", amount: Math.round(12 * stage.difficulty), icon: "ammo" },
  ];
}

export type ChestReward = {
  coins: number;
  label: string;
};

export const CHEST_REWARD: ChestReward = {
  coins: 50,
  label: "Cofre de suministros",
};

export const CHALLENGE_GEM_MULTIPLIER = 1.5;
