export type UpgradeId =
  | "damage"
  | "rapid"
  | "multishot"
  | "pierce"
  | "speed"
  | "maxhp"
  | "magnet"
  | "regen"
  | "bulletSpeed"
  | "crit"
  | "heal"
  | "nova"
  | "lifesteal"
  | "thorns"
  | "orbital";

export type Upgrade = {
  id: UpgradeId;
  label: string;
  description: string;
  max: number;
};

export const UPGRADES: Upgrade[] = [
  {
    id: "damage",
    label: "Dano+",
    description: "Aumenta el dano de tus balas en +20%",
    max: 8,
  },
  {
    id: "rapid",
    label: "Cadencia",
    description: "Disparas +20% mas rapido",
    max: 6,
  },
  {
    id: "multishot",
    label: "Multi-disparo",
    description: "Disparas +1 bala extra en abanico",
    max: 5,
  },
  {
    id: "pierce",
    label: "Perforacion",
    description: "Cada bala atraviesa +1 enemigo",
    max: 4,
  },
  {
    id: "speed",
    label: "Velocidad",
    description: "Te mueves +12% mas rapido",
    max: 6,
  },
  {
    id: "maxhp",
    label: "Vida maxima",
    description: "+20 de vida maxima y te curas +20",
    max: 6,
  },
  {
    id: "magnet",
    label: "Iman",
    description: "Atraes gemas desde +30% de distancia",
    max: 5,
  },
  {
    id: "regen",
    label: "Regeneracion",
    description: "Recuperas +1 vida por segundo",
    max: 5,
  },
  {
    id: "bulletSpeed",
    label: "Balas rapidas",
    description: "Tus balas viajan +15% mas rapido",
    max: 5,
  },
  {
    id: "crit",
    label: "Critico",
    description: "+10% probabilidad de critico (x2.5)",
    max: 5,
  },
  {
    id: "heal",
    label: "Cura total",
    description: "Recuperas toda tu vida",
    max: 1,
  },
  {
    id: "nova",
    label: "Nova",
    description: "Al matar, explota una onda que daña enemigos cercanos",
    max: 5,
  },
  {
    id: "lifesteal",
    label: "Robo de vida",
    description: "Cada enemigo muerto te cura +1.5 de vida",
    max: 6,
  },
  {
    id: "thorns",
    label: "Espinas",
    description: "Los enemigos reciben 12 de dano al tocarte",
    max: 5,
  },
  {
    id: "orbital",
    label: "Orbital",
    description: "Añade una cuchilla que gira alrededor de ti y daña",
    max: 5,
  },
];