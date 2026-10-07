export type PerkId = "damage" | "maxhp" | "speed" | "magnet" | "regen";

export type Perk = {
  id: PerkId;
  label: string;
  description: string;
  max: number;
  baseCost: number;
  costMult: number;
};

export const PERKS: Perk[] = [
  {
    id: "damage",
    label: "Fuerza base",
    description: "+5% de dano permanente",
    max: 10,
    baseCost: 40,
    costMult: 1.5,
  },
  {
    id: "maxhp",
    label: "Vitalidad",
    description: "+10 de vida maxima al iniciar",
    max: 10,
    baseCost: 25,
    costMult: 1.5,
  },
  {
    id: "speed",
    label: "Zancada",
    description: "+3% de velocidad permanente",
    max: 10,
    baseCost: 30,
    costMult: 1.5,
  },
  {
    id: "magnet",
    label: "Iman",
    description: "+10 de magnetismo al iniciar",
    max: 10,
    baseCost: 20,
    costMult: 1.5,
  },
  {
    id: "regen",
    label: "Recuperacion",
    description: "+0.2 de regeneracion al iniciar",
    max: 10,
    baseCost: 35,
    costMult: 1.5,
  },
];

export type PerkLevels = Partial<Record<PerkId, number>>;

export function perkLevel(levels: PerkLevels, id: PerkId) {
  return levels[id] ?? 0;
}

export function costOf( who: Perk, current: number ) {
  return Math.round(who.baseCost * Math.pow(who.costMult, current));
}