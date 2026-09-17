import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { showRewardedAd } from "./src/ads";
import { GameScreen, type SessionResult } from "./src/screens/GameScreen";
import { HomeScreen } from "./src/screens/HomeScreen";

const COINS_KEY = "cs_coins";
const BEST_SCORE_KEY = "cs_best_score";
const BEST_LEVEL_KEY = "cs_best_level";

const DAILY_REWARD = 50;

export default function App() {
  const [screen, setScreen] = useState<"home" | "game">("home");
  const [coins, setCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestLevel, setBestLevel] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [coinsValue, scoreValue, levelValue] = await Promise.all([
        AsyncStorage.getItem(COINS_KEY),
        AsyncStorage.getItem(BEST_SCORE_KEY),
        AsyncStorage.getItem(BEST_LEVEL_KEY),
      ]);

      setCoins(Number(coinsValue ?? 0));
      setBestScore(Number(scoreValue ?? 0));
      setBestLevel(Number(levelValue ?? 1));
      setLoaded(true);
    };

    load();
  }, []);

  const handleFinish = async (session: SessionResult) => {
    const newCoins = coins + session.coins;
    const newBestScore = Math.max(bestScore, session.score);
    const newBestLevel = Math.max(bestLevel, session.level);

    setCoins(newCoins);
    setBestScore(newBestScore);
    setBestLevel(newBestLevel);

    await Promise.all([
      AsyncStorage.setItem(COINS_KEY, String(newCoins)),
      AsyncStorage.setItem(BEST_SCORE_KEY, String(newBestScore)),
      AsyncStorage.setItem(BEST_LEVEL_KEY, String(newBestLevel)),
    ]);

    setScreen("home");
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

  if (!loaded) {
    return null;
  }

  if (screen === "game") {
    return <GameScreen onFinish={handleFinish} />;
  }

  return (
    <HomeScreen
      coins={coins}
      bestScore={bestScore}
      bestLevel={bestLevel}
      onPlay={() => setScreen("game")}
      onClaimReward={handleClaimReward}
    />
  );
}