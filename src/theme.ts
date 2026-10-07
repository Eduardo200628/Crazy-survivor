export const HUB_COLORS = {
  background: "#0a1128",
  backgroundAlt: "#16203f",
  backgroundDeep: "#05081a",

  panel: "#1c2649",
  panelAlt: "#283561",
  panelBorder: "#3b5090",
  card: "#31447b",
  cardBorder: "#54679c",

  shadow: "#04060f",
  shadowSoft: "rgba(4, 7, 18, 0.55)",
  gloss: "rgba(255, 255, 255, 0.16)",
  glossSoft: "rgba(255, 255, 255, 0.07)",
  rimLight: "#8fa6e0",
  haze: "rgba(240, 178, 74, 0.07)",

  yellow: "#f3ca45",
  yellowLight: "#feebad",
  yellowDark: "#a8760f",
  amber: "#cf9845",
  amberDark: "#7d5417",

  blue: "#0373bc",
  blueLight: "#3aa6e8",
  blueDark: "#01254b",

  orange: "#f07742",
  orangeDark: "#9c3d12",

  violet: "#c563f0",
  violetDark: "#5b1a91",

  gray: "#8e9ac0",
  grayDark: "#3a4270",
  text: "#f7ecd4",
  textMuted: "#a8adc9",
  textDark: "#1a1206",
  success: "#2fd0bd",
  successDark: "#0b5d55",
  successDeep: "#073f39",
  danger: "#e8455f",
  dangerDark: "#8f1128",
  gem: "#c563f0",
  locked: "#232b52",
};

export const HUB_RADIUS = {
  small: 8,
  medium: 12,
  large: 18,
  pill: 999,
};

export const HUB_DEPTH = {
  flat: 2,
  raised: 4,
  chunky: 6,
};

export function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
