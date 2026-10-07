import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { showRewardedAd } from "./src/ads";
import {
  CHARACTERS,
  CHESTS,
  CHEST_PACK_DISCOUNT,
  GOLD_OFFERS,
  STAGES,
  WEAPONS,
  stageIndex,
  type CharacterId,
  type ChestId,
  type DiamondPack,
  type DiamondPackId,
  type GoldOfferId,
  type StageId,
  type WeaponId,
} from "./src/catalog";
import { PERKS, costOf, perkLevel, type PerkId, type PerkLevels } from "./src/perks";
import { initAudio, setMusicEnabled, startMusic } from "./src/audio";
import { GameScreen, type SessionResult } from "./src/screens/GameScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ShopIapProvider } from "./src/shopIap";

const COINS_KEY = "cs_coins";
const GEMS_KEY = "cs_gems";
const BEST_SCORE_KEY = "cs_best_score";
const BEST_LEVEL_KEY = "cs_best_level";
const PERKS_KEY = "cs_perks";
const OWNED_WEAPONS_KEY = "cs_owned_weapons";
const OWNED_CHARACTERS_KEY = "cs_owned_characters";
const EQUIPPED_WEAPON_KEY = "cs_equipped_weapon";
const EQUIPPED_CHARACTER_KEY = "cs_equipped_character";
const STAGES_CLEARED_KEY = "cs_stages_cleared";
const SELECTED_STAGE_KEY = "cs_selected_stage";
const SOUND_KEY = "cs_sound";

const DAILY_REWARD = 50;

function parseList<T extends string>(value: string | null, fallback: T[]): T[] {
  if (!value) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isStageUnlocked(id: StageId, cleared: number) {
  return stageIndex(id) <= cleared;
}

function nextPlayableStage(cleared: number): StageId {
  return STAGES[Math.min(cleared, STAGES.length - 1)].id;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(1);
  const [perks, setPerks] = useState<PerkLevels>({});
  const [ownedWeapons, setOwnedWeapons] = useState<WeaponId[]>(["pistol"]);
  const [ownedCharacters, setOwnedCharacters] = useState<CharacterId[]>(["rookie"]);
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponId>("pistol");
  const [equippedCharacter, setEquippedCharacter] = useState<CharacterId>("rookie");
  const [stagesCleared, setStagesCleared] = useState(0);
  const [selectedStage, setSelectedStage] = useState<StageId>("stage1");
  const [activeStage, setActiveStage] = useState<StageId | null>(null);
  const [challengeRun, setChallengeRun] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [lastGemPurchase, setLastGemPurchase] = useState<{
    id: DiamondPackId;
    gems: number;
    at: number;
  } | null>(null);

  const gemsRef = useRef(gems);
  gemsRef.current = gems;

  const handleIapGranted = useCallback((pack: DiamondPack) => {
    const newGems = gemsRef.current + pack.gems;
    gemsRef.current = newGems;
    setGems(newGems);
    void AsyncStorage.setItem(GEMS_KEY, String(newGems));
    setLastGemPurchase({ id: pack.id, gems: pack.gems, at: Date.now() });
  }, []);

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    const load = async () => {
      const [
        coinsValue,
        gemsValue,
        scoreValue,
        levelValue,
        perksValue,
        weaponsValue,
        charactersValue,
        equippedWeaponValue,
        equippedCharacterValue,
        stagesClearedValue,
        selectedStageValue,
        soundValue,
      ] = await Promise.all([
        AsyncStorage.getItem(COINS_KEY),
        AsyncStorage.getItem(GEMS_KEY),
        AsyncStorage.getItem(BEST_SCORE_KEY),
        AsyncStorage.getItem(BEST_LEVEL_KEY),
        AsyncStorage.getItem(PERKS_KEY),
        AsyncStorage.getItem(OWNED_WEAPONS_KEY),
        AsyncStorage.getItem(OWNED_CHARACTERS_KEY),
        AsyncStorage.getItem(EQUIPPED_WEAPON_KEY),
        AsyncStorage.getItem(EQUIPPED_CHARACTER_KEY),
        AsyncStorage.getItem(STAGES_CLEARED_KEY),
        AsyncStorage.getItem(SELECTED_STAGE_KEY),
        AsyncStorage.getItem(SOUND_KEY),
      ]);

      const cleared = Math.max(0, Number(stagesClearedValue ?? 0));
      const weapons = parseList<WeaponId>(weaponsValue, ["pistol"]);
      const characters = parseList<CharacterId>(charactersValue, ["rookie"]);

      setCoins(Number(coinsValue ?? 0));
      setGems(Number(gemsValue ?? 0));
      setBestScore(Number(scoreValue ?? 0));
      setBestLevel(Number(levelValue ?? 1));
      try {
        setPerks(perksValue ? (JSON.parse(perksValue) as PerkLevels) : {});
      } catch {
        setPerks({});
      }
      setOwnedWeapons(weapons.includes("pistol") ? weapons : ["pistol", ...weapons]);
      setOwnedCharacters(characters.includes("rookie") ? characters : ["rookie", ...characters]);
      setEquippedWeapon(weapons.includes(equippedWeaponValue as WeaponId) ? (equippedWeaponValue as WeaponId) : "pistol");
      setEquippedCharacter(
        characters.includes(equippedCharacterValue as CharacterId)
          ? (equippedCharacterValue as CharacterId)
          : "rookie",
      );
      setStagesCleared(cleared);
      setSoundOn(soundValue !== "0");
      setMusicEnabled(soundValue !== "0");

      const storedStage = selectedStageValue as StageId | null;
      const validStage = STAGES.some((stage) => stage.id === storedStage) ? storedStage : null;
      setSelectedStage(validStage && isStageUnlocked(validStage, cleared) ? validStage : nextPlayableStage(cleared));

      setLoaded(true);
    };

    load();
  }, []);

  const handleFinish = async (session: SessionResult) => {
    const newCoins = coins + session.coins;
    const newGems = gems + session.gems;
    const newBestScore = Math.max(bestScore, session.score);
    const newBestLevel = Math.max(bestLevel, session.level);
    const newStagesCleared = session.cleared
      ? Math.max(stagesCleared, stageIndex(session.stageId) + 1)
      : stagesCleared;
    const newSelectedStage = nextPlayableStage(newStagesCleared);

    setCoins(newCoins);
    setGems(newGems);
    setBestScore(newBestScore);
    setBestLevel(newBestLevel);
    setStagesCleared(newStagesCleared);
    setSelectedStage(newSelectedStage);

    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(newCoins)),
      AsyncStorage.setItem(GEMS_KEY, String(newGems)),
      AsyncStorage.setItem(BEST_SCORE_KEY, String(newBestScore)),
      AsyncStorage.setItem(BEST_LEVEL_KEY, String(newBestLevel)),
      AsyncStorage.setItem(STAGES_CLEARED_KEY, String(newStagesCleared)),
      AsyncStorage.setItem(SELECTED_STAGE_KEY, newSelectedStage),
    ]);

    setActiveStage(null);
    setChallengeRun(false);
    setScreen("home");
  };

  const handleToggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    setMusicEnabled(next);
    await AsyncStorage.setItem(SOUND_KEY, next ? "1" : "0");
  };

  const handleClaimReward = async () => {
    const rewarded = await showRewardedAd();
    if (!rewarded) {
      return;
    }

    const newCoins = coins + DAILY_REWARD;
    setCoins(newCoins);
    await AsyncStorage.setItem(COINS_KEY, String(newCoins));
  };

  const handleBuyGoldOffer = async (id: GoldOfferId): Promise<number> => {
    const offer = GOLD_OFFERS.find((item) => item.id === id);
    if (!offer) {
      return 0;
    }

    if (offer.ad) {
      const rewarded = await showRewardedAd();
      if (!rewarded) {
        return 0;
      }
    } else if (gems < offer.gems) {
      return 0;
    }

    const newCoins = coins + offer.coins;
    const newGems = gems - offer.gems;
    setCoins(newCoins);
    setGems(newGems);

    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(newCoins)),
      AsyncStorage.setItem(GEMS_KEY, String(newGems)),
    ]);
    return offer.coins;
  };

  const handleOpenChest = async (id: ChestId, count = 1, free = false): Promise<number> => {
    const chest = CHESTS.find((item) => item.id === id);
    if (!chest) {
      return 0;
    }

    const packCost =
      count > 1 ? Math.round(chest.gems * count * CHEST_PACK_DISCOUNT) : chest.gems;

    if (free) {
      const rewarded = await showRewardedAd();
      if (!rewarded) {
        return 0;
      }
    } else if (gems < packCost) {
      return 0;
    }

    let reward = 0;
    for (let index = 0; index < count; index += 1) {
      reward +=
        chest.coins[0] + Math.floor(Math.random() * (chest.coins[1] - chest.coins[0] + 1));
    }

    const newCoins = coins + reward;
    const newGems = free ? gems : gems - packCost;
    setCoins(newCoins);
    setGems(newGems);

    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(newCoins)),
      AsyncStorage.setItem(GEMS_KEY, String(newGems)),
    ]);
    return reward;
  };

  const handleBuyWeapon = async (id: WeaponId) => {
    if (ownedWeapons.includes(id)) {
      return;
    }
    const definition = WEAPONS.find((weapon) => weapon.id === id);
    if (!definition || gems < definition.cost) {
      return;
    }

    const newGems = gems - definition.cost;
    const newOwned = [...ownedWeapons, id];
    setGems(newGems);
    setOwnedWeapons(newOwned);
    setEquippedWeapon(id);

    await Promise.all([
      AsyncStorage.setItem(GEMS_KEY, String(newGems)),
      AsyncStorage.setItem(OWNED_WEAPONS_KEY, JSON.stringify(newOwned)),
      AsyncStorage.setItem(EQUIPPED_WEAPON_KEY, id),
    ]);
  };

  const handleBuyCharacter = async (id: CharacterId) => {
    if (ownedCharacters.includes(id)) {
      return;
    }
    const definition = CHARACTERS.find((character) => character.id === id);
    if (!definition || gems < definition.cost) {
      return;
    }

    const newGems = gems - definition.cost;
    const newOwned = [...ownedCharacters, id];
    setGems(newGems);
    setOwnedCharacters(newOwned);
    setEquippedCharacter(id);

    await Promise.all([
      AsyncStorage.setItem(GEMS_KEY, String(newGems)),
      AsyncStorage.setItem(OWNED_CHARACTERS_KEY, JSON.stringify(newOwned)),
      AsyncStorage.setItem(EQUIPPED_CHARACTER_KEY, id),
    ]);
  };

  const handleEquipWeapon = async (id: WeaponId) => {
    if (!ownedWeapons.includes(id)) {
      return;
    }
    setEquippedWeapon(id);
    await AsyncStorage.setItem(EQUIPPED_WEAPON_KEY, id);
  };

  const handleEquipCharacter = async (id: CharacterId) => {
    if (!ownedCharacters.includes(id)) {
      return;
    }
    setEquippedCharacter(id);
    await AsyncStorage.setItem(EQUIPPED_CHARACTER_KEY, id);
  };

  const handleSelectStage = async (id: StageId) => {
    if (!isStageUnlocked(id, stagesCleared)) {
      return;
    }
    setSelectedStage(id);
    await AsyncStorage.setItem(SELECTED_STAGE_KEY, id);
  };

  const handlePlay = (challenge: boolean) => {
    setActiveStage(selectedStage);
    setChallengeRun(challenge);
    setScreen("game");
  };

  const handleResetProgress = async () => {
    await AsyncStorage.multiRemove([
      COINS_KEY,
      GEMS_KEY,
      BEST_SCORE_KEY,
      BEST_LEVEL_KEY,
      PERKS_KEY,
      OWNED_WEAPONS_KEY,
      OWNED_CHARACTERS_KEY,
      EQUIPPED_WEAPON_KEY,
      EQUIPPED_CHARACTER_KEY,
      STAGES_CLEARED_KEY,
      SELECTED_STAGE_KEY,
    ]);

    setCoins(0);
    setGems(0);
    setBestScore(0);
    setBestLevel(1);
    setPerks({});
    setOwnedWeapons(["pistol"]);
    setOwnedCharacters(["rookie"]);
    setEquippedWeapon("pistol");
    setEquippedCharacter("rookie");
    setStagesCleared(0);
    setSelectedStage("stage1");
  };

  const handleBuyPerk = async (id: PerkId) => {
    const definition = PERKS.find((perk) => perk.id === id);
    if (!definition) {
      return;
    }
    const current = perkLevel(perks, id);
    const cost = costOf(definition, current);

    if (coins < cost) {
      return;
    }

    const newCoins = coins - cost;
    const newPerks = { ...perks, [id]: current + 1 };
    setCoins(newCoins);
    setPerks(newPerks);

    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(newCoins)),
      AsyncStorage.setItem(PERKS_KEY, JSON.stringify(newPerks)),
    ]);
  };

  useEffect(() => {
    if (screen === "home") {
      startMusic();
    }
  }, [screen]);

  if (!loaded) {
    return null;
  }

  if (screen === "game" && activeStage) {
    return (
      <GameScreen
        challenge={challengeRun}
        onFinish={handleFinish}
        perks={perks}
        stageId={activeStage}
        weaponId={equippedWeapon}
        characterId={equippedCharacter}
      />
    );
  }

  return (
    <ShopIapProvider onGranted={handleIapGranted}>
      <HomeScreen
        coins={coins}
        gems={gems}
        bestScore={bestScore}
        bestLevel={bestLevel}
        perks={perks}
        ownedWeapons={ownedWeapons}
        ownedCharacters={ownedCharacters}
        equippedWeapon={equippedWeapon}
        equippedCharacter={equippedCharacter}
        stagesCleared={stagesCleared}
        selectedStage={selectedStage}
        onPlay={() => handlePlay(false)}
        onChallenge={() => handlePlay(true)}
        onSelectStage={handleSelectStage}
        onClaimReward={handleClaimReward}
        onToggleSound={handleToggleSound}
        soundOn={soundOn}
        onBuyPerk={handleBuyPerk}
        onBuyWeapon={handleBuyWeapon}
        onBuyCharacter={handleBuyCharacter}
        onBuyGoldOffer={handleBuyGoldOffer}
        onOpenChest={handleOpenChest}
        onEquipWeapon={handleEquipWeapon}
        onEquipCharacter={handleEquipCharacter}
        onResetProgress={handleResetProgress}
        lastGemPurchase={lastGemPurchase}
      />
    </ShopIapProvider>
  );
}
