import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  CHEST_PACK_DISCOUNT,
  CHEST_PACK_SIZE,
  CHESTS,
  DIAMOND_PACKS,
  GOLD_OFFERS,
  type ChestId,
  type DiamondPack,
  type DiamondPackId,
  type GoldOfferId,
} from "../catalog";
import { HUB_COLORS, HUB_RADIUS, withAlpha } from "../theme";
import { Bevel } from "./Bevel";
import { Icon } from "./Icon";

type ChestTheme = {
  background: string;
  border: string;
  depth: string;
  text: string;
  muted: string;
  accent: string;
};

type Chest = {
  id: ChestId;
  title: string;
  description: string;
  progress?: string;
  theme: ChestTheme;
};

const SILVER: ChestTheme = {
  accent: HUB_COLORS.blueLight,
  background: HUB_COLORS.blue,
  border: HUB_COLORS.blueLight,
  depth: HUB_COLORS.blueDark,
  muted: withAlpha(HUB_COLORS.text, 0.85),
  text: HUB_COLORS.text,
};

const GOLD: ChestTheme = {
  accent: HUB_COLORS.yellowLight,
  background: HUB_COLORS.yellow,
  border: HUB_COLORS.amber,
  depth: HUB_COLORS.amberDark,
  muted: withAlpha(HUB_COLORS.textDark, 0.7),
  text: HUB_COLORS.textDark,
};

const PURPLE: ChestTheme = {
  accent: HUB_COLORS.violet,
  background: HUB_COLORS.violetDark,
  border: HUB_COLORS.violet,
  depth: HUB_COLORS.shadow,
  muted: withAlpha(HUB_COLORS.text, 0.85),
  text: HUB_COLORS.text,
};

const CHEST_UI: Chest[] = [
  {
    id: "silver",
    title: "Cofre de plata",
    description: "Objetos comunes y monedas con cada apertura.",
    theme: SILVER,
  },
  {
    id: "hero",
    title: "Cofre de héroe",
    description: "Un héroe completo o fragmentos de héroe.",
    progress: "Guaranteed Hero 0/50",
    theme: GOLD,
  },
  {
    id: "weapon",
    title: "Cofre de armas",
    description: "Un arma completa o fragmentos de arma.",
    progress: "Guaranteed Weapon 0/50",
    theme: PURPLE,
  },
];

const BLUE_PACK: ChestTheme = {
  accent: HUB_COLORS.blueLight,
  background: HUB_COLORS.blue,
  border: HUB_COLORS.blueLight,
  depth: HUB_COLORS.blueDark,
  muted: withAlpha(HUB_COLORS.text, 0.85),
  text: HUB_COLORS.text,
};

const GREEN_PACK: ChestTheme = {
  accent: HUB_COLORS.success,
  background: HUB_COLORS.success,
  border: HUB_COLORS.successDark,
  depth: HUB_COLORS.successDark,
  muted: withAlpha(HUB_COLORS.textDark, 0.75),
  text: HUB_COLORS.textDark,
};

function Separator({ label }: { label: string }) {
  return (
    <View style={styles.separator}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>{label}</Text>
      <View style={styles.separatorLine} />
    </View>
  );
}

type Props = {
  coins: number;
  gems: number;
  pending: string | null;
  iapReady: boolean;
  iapConfigured: string[];
  displayPrices: Record<string, string>;
  lastGemPurchase: { id: DiamondPackId; gems: number; at: number } | null;
  onBuyDiamond: (pack: DiamondPack) => Promise<boolean>;
  onBuyGold: (id: GoldOfferId) => Promise<number | undefined>;
  onOpenChest: (id: ChestId, count?: number, free?: boolean) => Promise<number | undefined>;
};

export function ShopPanel({
  coins,
  displayPrices,
  gems,
  iapConfigured,
  iapReady,
  lastGemPurchase,
  onBuyDiamond,
  onBuyGold,
  onOpenChest,
  pending,
}: Props) {
  const [flash, setFlash] = useState<string | null>(null);
  const [buyingStoreId, setBuyingStoreId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashMessage = useCallback((message: string) => {
    if (flashTimer.current) {
      clearTimeout(flashTimer.current);
    }
    setFlash(message);
    flashTimer.current = setTimeout(() => setFlash(null), 2400);
  }, []);

  useEffect(() => {
    if (!lastGemPurchase) {
      return;
    }
    const timer = setTimeout(() => {
      flashMessage(`+${lastGemPurchase.gems} 💎`);
    }, 0);
    return () => clearTimeout(timer);
  }, [flashMessage, lastGemPurchase]);

  const buyDiamond = async (pack: DiamondPack) => {
    setBuyingStoreId(pack.storeId);
    try {
      await onBuyDiamond(pack);
    } finally {
      setBuyingStoreId(null);
    }
  };

  const buyGold = async (id: GoldOfferId) => {
    const granted = await onBuyGold(id);
    if (granted) {
      flashMessage(`+${granted} 🪙`);
    }
  };

  const openChest = async (id: ChestId, count?: number, free?: boolean) => {
    const reward = await onOpenChest(id, count, free);
    if (reward) {
      flashMessage(`+${reward} 🪙 en ${free ? "anuncio" : "cofre"}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      {CHEST_UI.map((chest) => {
        const definition = CHESTS.find((item) => item.id === chest.id) ?? CHESTS[0];
        const packCost = Math.round(definition.gems * CHEST_PACK_SIZE * CHEST_PACK_DISCOUNT);
        const buying = `chest-${chest.id}`;
        const freeKey = `chest-${chest.id}-free`;
        const multiKey = `chest-${chest.id}-x${CHEST_PACK_SIZE}`;

        return (
          <Bevel
            bevelColor={chest.theme.depth}
            color={chest.theme.background}
            depth={4}
            faceStyle={styles.chestFace}
            key={chest.id}
            radius={HUB_RADIUS.large}
            rimColor={chest.theme.border}
            style={styles.chest}
          >
            <Text style={[styles.chestTitle, { color: chest.theme.text }]}>{chest.title}</Text>

            <View style={styles.chestBody}>
              <View
                style={[
                  styles.chestArt,
                  { backgroundColor: withAlpha(chest.theme.accent, 0.22), borderColor: chest.theme.accent },
                ]}
              >
                <Icon color={chest.theme.accent} name="chest" size={36} />
              </View>
              <View style={styles.chestDescCol}>
                <Text style={[styles.chestDesc, { color: chest.theme.muted }]}>{chest.description}</Text>
                {chest.progress ? (
                  <View style={styles.guarantee}>
                    <View style={styles.guaranteeRow}>
                      <Text style={[styles.guaranteeLabel, { color: chest.theme.text }]}>
                        {chest.progress}
                      </Text>
                    </View>
                    <View style={styles.guaranteeTrack}>
                      <View style={[styles.guaranteeFill, { width: "0%" }]} />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.chestOffers}>
              <Pressable
                accessibilityRole="button"
                disabled={pending === buying || gems < definition.gems}
                onPress={() => void openChest(chest.id, 1)}
                style={({ pressed }) => [
                  styles.offerButton,
                  {
                    opacity: pending === buying || gems < definition.gems ? 0.5 : 1,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}
              >
                <Icon color={chest.theme.text} name="gem" size={12} />
                <Text style={[styles.offerButtonText, { color: chest.theme.text }]}>
                  {definition.gems} 💎
                </Text>
              </Pressable>

              {chest.id === "silver" ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={pending === freeKey}
                  onPress={() => void openChest(chest.id, 1, true)}
                  style={({ pressed }) => [
                    styles.offerButton,
                    {
                      opacity: pending === freeKey ? 0.5 : 1,
                      transform: [{ translateY: pressed ? 2 : 0 }],
                    },
                  ]}
                >
                  <Icon color={HUB_COLORS.text} name="play" size={12} />
                  <Text style={styles.offerButtonText}>{pending === freeKey ? "..." : "GRATIS"}</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={pending === multiKey || gems < packCost}
                  onPress={() => void openChest(chest.id, CHEST_PACK_SIZE)}
                  style={({ pressed }) => [
                    styles.offerButton,
                    {
                      opacity: pending === multiKey || gems < packCost ? 0.5 : 1,
                      transform: [{ translateY: pressed ? 2 : 0 }],
                    },
                  ]}
                >
                  <Text style={styles.offerButtonText}>{packCost} 💎 {CHEST_PACK_SIZE}</Text>
                  <Text style={styles.offerButtonTag}>10 veces</Text>
                </Pressable>
              )}
            </View>
          </Bevel>
        );
      })}

      <Separator label="Comprar diamantes" />

      <View style={styles.packRow}>
        {DIAMOND_PACKS.map((pack) => {
          const available = iapReady && iapConfigured.includes(pack.storeId);
          const busy = buyingStoreId === pack.storeId;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={!available || busy}
              key={pack.id}
              onPress={() => void buyDiamond(pack)}
              style={({ pressed }) => [
                styles.packCard,
                {
                  backgroundColor: BLUE_PACK.background,
                  borderColor: BLUE_PACK.border,
                  opacity: !available || busy ? 0.6 : 1,
                  shadowColor: BLUE_PACK.accent,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={styles.packArt}>
                <Icon color={HUB_COLORS.yellowLight} name="gem" size={26} />
              </View>
              <Text style={[styles.packLabel, { color: BLUE_PACK.text }]}>
                {busy ? "..." : pack.label}
              </Text>
              <Text style={[styles.packPrice, { color: BLUE_PACK.muted }]}>
                {available ? (displayPrices[pack.storeId] ?? pack.priceLabel) : "Próximamente"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Separator label="Canjear oro" />

      <View style={styles.packRow}>
        {GOLD_OFFERS.map((offer) => {
          const affordable = offer.gems === 0 || gems >= offer.gems;
          const busy = pending === `gold-${offer.id}`;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={!affordable || busy}
              key={offer.id}
              onPress={() => void buyGold(offer.id)}
              style={({ pressed }) => [
                styles.packCard,
                {
                  backgroundColor: GREEN_PACK.background,
                  borderColor: GREEN_PACK.border,
                  opacity: !affordable || busy ? 0.5 : 1,
                  shadowColor: GREEN_PACK.accent,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={styles.packArt}>
                <Icon color={HUB_COLORS.textDark} name="coin" size={26} />
              </View>
              <Text style={[styles.packLabel, { color: GREEN_PACK.text }]}>{offer.label}</Text>
              <Text style={[styles.packPrice, { color: GREEN_PACK.muted }]}>
                {offer.ad ? "GRATIS" : `${offer.gems} 💎`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {flash ? (
        <View style={styles.flash}>
          <Text style={styles.flashText}>{flash}</Text>
        </View>
      ) : null}
      <View style={styles.balanceHint}>
        <Text style={styles.balanceHintText}>
          Oro: {coins} · Gemas: {gems}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  chest: {},
  chestFace: {
    gap: 10,
    padding: 14,
  },
  chestTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  chestBody: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  chestArt: {
    alignItems: "center",
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 2,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  chestDescCol: {
    flex: 1,
    gap: 6,
  },
  chestDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  guarantee: {
    gap: 3,
  },
  guaranteeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  guaranteeLabel: {
    fontSize: 10,
    fontWeight: "800",
  },
  guaranteeTrack: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderColor: withAlpha(HUB_COLORS.gloss, 0.4),
    borderRadius: HUB_RADIUS.pill,
    borderWidth: 1,
    height: 8,
    overflow: "hidden",
  },
  guaranteeFill: {
    backgroundColor: HUB_COLORS.amber,
    height: "100%",
  },
  chestOffers: {
    flexDirection: "row",
    gap: 8,
  },
  offerButton: {
    alignItems: "center",
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.28),
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  offerButtonText: {
    color: HUB_COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  offerButtonTag: {
    color: HUB_COLORS.yellow,
    fontSize: 10,
    fontWeight: "900",
  },
  separator: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  separatorLine: {
    backgroundColor: HUB_COLORS.panelBorder,
    borderRadius: 1,
    flex: 1,
    height: 2,
  },
  separatorText: {
    color: HUB_COLORS.yellow,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  packRow: {
    flexDirection: "row",
    gap: 8,
  },
  packCard: {
    alignItems: "center",
    borderBottomWidth: 4,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 2,
    elevation: 3,
    flex: 1,
    gap: 4,
    paddingVertical: 12,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  packArt: {
    alignItems: "center",
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.22),
    borderRadius: HUB_RADIUS.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  packLabel: {
    fontSize: 18,
    fontWeight: "900",
  },
  packPrice: {
    fontSize: 12,
    fontWeight: "800",
  },
  flash: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.success,
    borderBottomColor: HUB_COLORS.successDark,
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 2,
    paddingVertical: 10,
  },
  flashText: {
    color: HUB_COLORS.textDark,
    fontSize: 14,
    fontWeight: "900",
  },
  balanceHint: {
    alignItems: "center",
    paddingBottom: 4,
  },
  balanceHintText: {
    color: HUB_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});