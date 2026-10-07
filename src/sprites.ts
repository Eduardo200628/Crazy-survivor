import type { ImageSourcePropType } from "react-native";
import type { DropKind, EnemyKind, PickupKind } from "./engine";
import type { StageId } from "./catalog";

const PLAYER = require("../assets/characters/player.png") as ImageSourcePropType;
const BASIC = require("../assets/characters/enemy_basic.png") as ImageSourcePropType;
const FAST = require("../assets/characters/enemy_fast.png") as ImageSourcePropType;
const TANK = require("../assets/characters/enemy_tank.png") as ImageSourcePropType;
const COIN = require("../assets/items/coin.png") as ImageSourcePropType;
const GEM = require("../assets/items/gem.png") as ImageSourcePropType;
const XP = require("../assets/items/xp.png") as ImageSourcePropType;
const HEAL = require("../assets/items/heal.png") as ImageSourcePropType;
const BOMB = require("../assets/items/bomb.png") as ImageSourcePropType;
const COIN_PILE = require("../assets/items/coin_pile.png") as ImageSourcePropType;
const GEM_BAG = require("../assets/items/gem_bag.png") as ImageSourcePropType;

export const PLAYER_SPRITE = PLAYER;

export const ENEMY_SPRITES: Partial<Record<EnemyKind, ImageSourcePropType>> = {
  walker: BASIC,
  runner: FAST,
  tank: TANK,
};

export const PLAYER_SPRITE_SIZE = { height: 40, width: 35 };

export const ENEMY_SPRITE_SIZES: Partial<Record<EnemyKind, { height: number; width: number }>> = {
  walker: { height: 39, width: 36 },
  runner: { height: 31, width: 28 },
  tank: { height: 58, width: 60 },
};

export const STAGE_BOSS_SPRITES: Record<StageId, ImageSourcePropType> = {
  stage1: BASIC,
  stage2: FAST,
  stage3: TANK,
  stage4: TANK,
  stage5: TANK,
};

export const STAGE_BOSS_SIZES: Record<StageId, { height: number; width: number }> = {
  stage1: { height: 56, width: 52 },
  stage2: { height: 50, width: 46 },
  stage3: { height: 78, width: 80 },
  stage4: { height: 86, width: 88 },
  stage5: { height: 94, width: 96 },
};

export const DROP_SPRITES: Record<DropKind, ImageSourcePropType> = {
  coin: COIN,
  gem: GEM,
  xp: XP,
};

export const PICKUP_SPRITES: Record<PickupKind, ImageSourcePropType> = {
  bomb: BOMB,
  coins: COIN_PILE,
  gems: GEM_BAG,
  heal: HEAL,
};
