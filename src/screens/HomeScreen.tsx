import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNav } from "../components/BottomNav";
import { HeroPanel } from "../components/HeroPanel";
import { Icon } from "../components/Icon";
import { LoadoutBar } from "../components/LoadoutBar";
import { MenuDropdown, type MenuOptionId } from "../components/MenuDropdown";
import { PixelBackground } from "../components/PixelBackground";
import { PixelButton } from "../components/PixelButton";
import { PerksPanel, WeaponsPanel, itemKey } from "../components/ShopPanels";
import { ShopPanel } from "../components/ShopPanel";
import { StagePanel } from "../components/StagePanel";
import { MENU_BUTTON_LAYOUT, TopBar } from "../components/TopBar";
import { Bevel } from "../components/Bevel";
import {
  CHARACTERS,
  CHALLENGE_GEM_MULTIPLIER,
  CHEST_REWARD,
  STAGES,
  WEAPONS,
  type CharacterId,
  type ChestId,
  type DiamondPack,
  type DiamondPackId,
  type GoldOfferId,
  type HubTabId,
  type StageId,
  type WeaponId,
} from "../catalog";
import { PERKS, type PerkId, type PerkLevels } from "../perks";
import { useShopIap } from "../shopIap";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS, withAlpha } from "../theme";
import { play } from "../audio";

type Props = {
  coins: number;
  gems: number;
  bestScore: number;
  bestLevel: number;
  perks: PerkLevels;
  ownedWeapons: WeaponId[];
  ownedCharacters: CharacterId[];
  equippedWeapon: WeaponId;
  equippedCharacter: CharacterId;
  stagesCleared: number;
  selectedStage: StageId;
  onPlay: () => void;
  onChallenge: () => void;
  onSelectStage: (id: StageId) => Promise<void>;
  onClaimReward: () => Promise<void>;
  onBuyPerk: (id: PerkId) => Promise<void>;
  onBuyWeapon: (id: WeaponId) => Promise<void>;
  onBuyCharacter: (id: CharacterId) => Promise<void>;
  onBuyGoldOffer: (id: GoldOfferId) => Promise<number>;
  onOpenChest: (id: ChestId, count?: number, free?: boolean) => Promise<number>;
  onEquipWeapon: (id: WeaponId) => Promise<void>;
  onEquipCharacter: (id: CharacterId) => Promise<void>;
  onResetProgress: () => Promise<void>;
  onToggleSound: () => Promise<void>;
  soundOn: boolean;
  lastGemPurchase: { id: DiamondPackId; gems: number; at: number } | null;
};

type Overlay = "menu" | "info" | null;

export function HomeScreen({
  coins,
  gems,
  bestScore,
  bestLevel,
  perks,
  ownedWeapons,
  ownedCharacters,
  equippedWeapon,
  equippedCharacter,
  stagesCleared,
  selectedStage,
  onPlay,
  onChallenge,
  onSelectStage,
  onClaimReward,
  onBuyPerk,
  onBuyWeapon,
  onBuyCharacter,
  onBuyGoldOffer,
  onOpenChest,
  onEquipWeapon,
  onEquipCharacter,
  onResetProgress,
  onToggleSound,
  soundOn,
  lastGemPurchase,
}: Props) {
  const [tab, setTab] = useState<HubTabId>("level");
  const shopIap = useShopIap();
  const [pending, setPending] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chestBusy, setChestBusy] = useState(false);
  const [chestClaimed, setChestClaimed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const insets = useSafeAreaInsets();

  const run = async <Result,>(
    key: string,
    action: () => Promise<Result> | Result,
  ): Promise<Result | undefined> => {
    if (pending) {
      return undefined;
    }
    setPending(key);
    try {
      return await action();
    } finally {
      setPending(null);
    }
  };

  const stage = STAGES.find((item) => item.id === selectedStage) ?? STAGES[0];
  const character = CHARACTERS.find((item) => item.id === equippedCharacter) ?? CHARACTERS[0];
  const weapon = WEAPONS.find((item) => item.id === equippedWeapon) ?? WEAPONS[0];
  const levelProgress = stagesCleared / STAGES.length;
  const shopBadge = !chestClaimed || gems >= 50;
  const menuTop =
    insets.top + MENU_BUTTON_LAYOUT.offsetY + MENU_BUTTON_LAYOUT.size + MENU_BUTTON_LAYOUT.gap;
  const menuLeft = MENU_BUTTON_LAYOUT.offsetX;

  const handleMenuSelect = (id: MenuOptionId) => {
    setMenuOpen(false);
    play("click");
    if (id === "settings") {
      setOverlay("menu");
    }
  };

  const handleChest = async () => {
    if (chestBusy || chestClaimed) {
      return;
    }
    setChestBusy(true);
    try {
      await onClaimReward();
      setChestClaimed(true);
      play("chest");
    } finally {
      setChestBusy(false);
    }
  };

  const handleReset = async () => {
    if (resetting) {
      return;
    }
    setResetting(true);
    try {
      await onResetProgress();
      setChestClaimed(false);
      setOverlay(null);
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <PixelBackground />

      <TopBar
        coins={coins}
        gems={gems}
        level={bestLevel}
        levelProgress={levelProgress}
        onAddCoins={() => setTab("shop")}
        onAddGems={() => setTab("shop")}
        onInfo={tab === "hero" ? () => setOverlay("info") : undefined}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === "level" ? (
            <StagePanel
              challengeMultiplier={CHALLENGE_GEM_MULTIPLIER}
              onChallenge={onChallenge}
              onPlay={onPlay}
              onSelectStage={(id) => run(itemKey("stage", id), () => onSelectStage(id))}
              selectedStage={selectedStage}
              stage={stage}
              stages={STAGES}
              stagesCleared={stagesCleared}
            />
          ) : null}

          {tab === "shop" ? (
            <ShopPanel
              coins={coins}
              displayPrices={shopIap.displayPrices}
              gems={gems}
              iapConfigured={shopIap.configuredStoreIds}
              iapReady={shopIap.ready}
              lastGemPurchase={lastGemPurchase}
              onBuyDiamond={(pack: DiamondPack) => shopIap.buyPack(pack)}
              onBuyGold={(id) => run(itemKey("gold", id), () => onBuyGoldOffer(id))}
              onOpenChest={(id, count, free) =>
                run(
                  itemKey(
                    "chest",
                    `${id}${free ? "-free" : count && count > 1 ? `-x${count}` : ""}`,
                  ),
                  () => onOpenChest(id, count, free),
                )
              }
              pending={pending}
            />
          ) : null}

          {tab === "hero" ? (
            <HeroPanel
              characters={CHARACTERS}
              equipped={equippedCharacter}
              gems={gems}
              onBuy={(id) => run(itemKey("hero", id), () => onBuyCharacter(id))}
              onEquip={(id) => run(itemKey("hero", id), () => onEquipCharacter(id))}
              owned={ownedCharacters}
              pending={pending}
              perks={perks}
            />
          ) : null}

          {tab === "armament" ? (
            <WeaponsPanel
              equipped={equippedWeapon}
              gems={gems}
              onBuy={(id) => run(itemKey("weapon", id), () => onBuyWeapon(id))}
              onEquip={(id) => run(itemKey("weapon", id), () => onEquipWeapon(id))}
              owned={ownedWeapons}
              pending={pending}
              weapons={WEAPONS}
            />
          ) : null}

          {tab === "talents" ? (
            <PerksPanel
              coins={coins}
              levels={perks}
              onBuy={(id) => run(itemKey("perk", id), () => onBuyPerk(id))}
              pending={pending}
              perks={PERKS}
            />
          ) : null}
        </ScrollView>

        <Pressable
          accessibilityLabel={`${CHEST_REWARD.label}: +${CHEST_REWARD.coins} monedas`}
          accessibilityRole="button"
          disabled={chestBusy || chestClaimed}
          onPress={handleChest}
          style={({ pressed }) => [
            styles.chest,
            chestClaimed && styles.chestClaimed,
            {
              backgroundColor: pressed && !chestClaimed ? HUB_COLORS.yellowDark : HUB_COLORS.yellow,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          {chestBusy ? (
            <ActivityIndicator color={HUB_COLORS.textDark} />
          ) : (
            <Icon color={HUB_COLORS.textDark} name="chest" size={26} />
          )}
          {chestClaimed ? null : <View style={styles.chestBadge} />}
        </Pressable>
      </View>

      {tab !== "hero" && tab !== "shop" ? (
        <LoadoutBar
          character={character}
          onChangeCharacter={() => setTab("hero")}
          onChangeWeapon={() => setTab("armament")}
          onInfo={() => setOverlay("info")}
          weapon={weapon}
        />
      ) : null}

      <BottomNav active={tab} onChange={setTab} shopBadge={shopBadge} />

      {menuOpen ? (
        <MenuDropdown
          left={menuLeft}
          onClose={() => setMenuOpen(false)}
          onSelect={handleMenuSelect}
          top={menuTop}
        />
      ) : null}

      {overlay === "menu" ? (
        <View style={styles.overlay}>
          <Bevel faceStyle={styles.overlayCardFace} radius={HUB_RADIUS.large} style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>AJUSTES</Text>
            <View style={styles.overlayStats}>
              <Text style={styles.overlayStatLine}>Monedas: {coins}</Text>
              <Text style={styles.overlayStatLine}>Gemas: {gems}</Text>
              <Text style={styles.overlayStatLine}>Mejor puntaje: {bestScore}</Text>
              <Text style={styles.overlayStatLine}>Zonas superadas: {stagesCleared}</Text>
            </View>
            <PixelButton
              fullWidth
              label={soundOn ? "🔊 Sonido: activado" : "🔇 Sonido: desactivado"}
              onPress={() => {
                void onToggleSound();
                play("click");
              }}
              variant="ghost"
            />
            <PixelButton
              disabled={resetting}
              fullWidth
              label={resetting ? "Reiniciando..." : "Reiniciar progreso"}
              onPress={handleReset}
              variant="danger"
            />
            <PixelButton fullWidth label="Cerrar" onPress={() => setOverlay(null)} variant="ghost" />
          </Bevel>
        </View>
      ) : null}

      {overlay === "info" ? (
        <View style={styles.overlay}>
          <Bevel faceStyle={styles.overlayCardFace} radius={HUB_RADIUS.large} style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>EQUIPAMIENTO</Text>
            <Text style={styles.overlayBody}>
              {character.label} define tu vida, velocidad y regeneracion. {weapon.label} define
              como dispara tu personaje. Los cambios se aplican al iniciar la proxima batalla.
            </Text>
            <PixelButton fullWidth label="Entendido" onPress={() => setOverlay(null)} />
          </Bevel>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  chest: {
    alignItems: "center",
    borderBottomColor: HUB_COLORS.amberDark,
    borderBottomWidth: HUB_DEPTH.chunky,
    borderColor: HUB_COLORS.amber,
    borderRadius: HUB_RADIUS.large,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 2,
    bottom: 14,
    height: 56,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 56,
  },
  chestClaimed: {
    opacity: 0.6,
  },
  chestBadge: {
    backgroundColor: HUB_COLORS.danger,
    borderColor: HUB_COLORS.backgroundDeep,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    right: -2,
    top: -2,
    width: 14,
  },
  overlay: {
    alignItems: "center",
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.86),
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 24,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlayCard: {
    width: "100%",
  },
  overlayCardFace: {
    gap: 12,
    padding: 20,
  },
  overlayTitle: {
    color: HUB_COLORS.yellow,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  overlayStats: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.flat,
    borderColor: HUB_COLORS.cardBorder,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  overlayStatLine: {
    color: HUB_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  overlayBody: {
    color: HUB_COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
});
