import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { levelOfCost, starsOfCost, type CharacterDef, type CharacterId } from "../catalog";
import { perkLevel, type PerkLevels } from "../perks";
import { PLAYER_SPRITE } from "../sprites";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS, withAlpha } from "../theme";
import { play } from "../audio";
import { Icon } from "./Icon";
import { PixelButton } from "./PixelButton";

const BASE_HP = 100;
const BASE_SPEED = 215;
const BASE_MAGNET = 130;

type Props = {
  characters: CharacterDef[];
  gems: number;
  owned: CharacterId[];
  equipped: CharacterId;
  perks: PerkLevels;
  pending: string | null;
  onBuy: (id: CharacterId) => void;
  onEquip: (id: CharacterId) => void;
};

function RaritySlot({ stars }: { stars: number }) {
  return (
    <View style={styles.raritySlot}>
      <Text style={styles.rarityStars}>{"★".repeat(stars)}</Text>
      <View style={styles.rarityLock}>
        <Icon color={HUB_COLORS.textMuted} name="lock" size={9} />
      </View>
    </View>
  );
}

export function HeroPanel({
  characters,
  gems,
  owned,
  equipped,
  perks,
  pending,
  onBuy,
  onEquip,
}: Props) {
  const selected = characters.find((item) => item.id === equipped) ?? characters[0];
  const maxHp = Math.max(40, BASE_HP + perkLevel(perks, "maxhp") * 10 + selected.hpBonus);
  const speed = BASE_SPEED * (1 + perkLevel(perks, "speed") * 0.03) * selected.speedMult;
  const magnet = BASE_MAGNET + perkLevel(perks, "magnet") * 10;
  const heartCount = Math.min(10, Math.max(1, Math.round(maxHp / 20)));
  const speedRatio = speed / BASE_SPEED;
  const speedLabel = speedRatio < 0.95 ? "Baja" : speedRatio <= 1.1 ? "Media" : "Alta";
  const speedTagColor =
    speedLabel === "Alta" ? HUB_COLORS.success : speedLabel === "Baja" ? HUB_COLORS.danger : HUB_COLORS.yellow;
  const speedFill = Math.max(0.08, Math.min(1, (speedRatio - 0.7) / 0.6));
  const rank = starsOfCost(selected.cost);
  const isMaxRank = rank >= 3;

  return (
    <View style={styles.wrapper}>
      <View style={styles.nameBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.heroName}>{selected.label}</Text>
          {isMaxRank ? <Icon color={HUB_COLORS.yellow} name="star" size={18} /> : null}
        </View>
      </View>

      <View style={styles.heroRow}>
        <View style={styles.statsCol}>
          <Text style={styles.statLabel}>PV</Text>
          <View style={styles.statsValueRow}>
            {Array.from({ length: heartCount }, (_, index) => (
              <Icon color={HUB_COLORS.danger} key={index} name="heart" size={14} />
            ))}
            <Text style={styles.statValue}>{maxHp}</Text>
          </View>

          <Text style={styles.statLabel}>Vel. de movimiento</Text>
          <View style={styles.speedRow}>
            <View style={styles.speedTrack}>
              <View
                style={[styles.speedFill, { backgroundColor: speedTagColor, width: `${Math.round(speedFill * 100)}%` }]}
              />
            </View>
            <Text style={[styles.speedTag, { color: speedTagColor }]}>{speedLabel}</Text>
          </View>

          <Text style={styles.statLabel}>Rango de recogida</Text>
          <Text style={styles.statValue}>{magnet}</Text>
        </View>

        <View style={styles.spriteCol}>
          <View
            style={[
              styles.spriteBox,
              { backgroundColor: withAlpha(selected.accent, 0.16), borderColor: selected.accent },
            ]}
          >
            <Image resizeMode="contain" source={PLAYER_SPRITE} style={styles.sprite} />
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionSlot}>
          <PixelButton compact fullWidth label="Mejorar" onPress={() => play("click")} variant="success" />
        </View>
        <View style={styles.actionSlot}>
          <PixelButton compact fullWidth label="Subir de rango" onPress={() => play("click")} variant="orange" />
        </View>
      </View>

      <View style={styles.passiveRow}>
        <View style={styles.passiveInfo}>
          <View style={styles.passiveIcon}>
            <Icon color={HUB_COLORS.yellow} name="shield" size={16} />
          </View>
          <View style={styles.passiveText}>
            <Text style={styles.passiveLabel}>Habilidad pasiva</Text>
            <Text style={styles.passiveName}>{selected.passive}</Text>
          </View>
        </View>
        <View style={styles.rarityRow}>
          <RaritySlot stars={3} />
          <RaritySlot stars={5} />
        </View>
      </View>

      <View style={styles.grid}>
        {characters.map((character) => {
          const isOwned = owned.includes(character.id);
          const isSelected = character.id === equipped;
          const disabled = isSelected || pending !== null || (!isOwned && gems < character.cost);
          return (
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              key={character.id}
              onPress={() => (isOwned ? onEquip(character.id) : onBuy(character.id))}
              style={({ pressed }) => [
                styles.gridCard,
                isSelected && styles.gridCardActive,
                { borderColor: isSelected ? HUB_COLORS.yellow : HUB_COLORS.cardBorder },
                { opacity: disabled && !isSelected ? 0.55 : 1, transform: [{ translateY: pressed ? 1 : 0 }] },
              ]}
            >
              <Text numberOfLines={1} style={styles.cardName}>
                {character.label}
              </Text>
              <View style={styles.cardArt}>
                <Image
                  resizeMode="contain"
                  source={PLAYER_SPRITE}
                  style={[styles.cardImage, { opacity: isOwned ? 1 : 0.5 }]}
                />
                {!isOwned ? (
                  <View style={styles.cardLock}>
                    <Icon color={HUB_COLORS.textMuted} name="lock" size={14} />
                  </View>
                ) : null}
                {isSelected ? (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Nv.{levelOfCost(character.cost)}</Text>
                  </View>
                ) : null}
              </View>
              {!isOwned ? (
                <View style={styles.cardCost}>
                  <Icon color={HUB_COLORS.gem} name="gem" size={10} />
                  <Text style={styles.cardCostText}>{character.cost}</Text>
                </View>
              ) : (
                <View style={styles.cardCostEmpty} />
              )}
              <View style={styles.cardsProgress}>
                <View style={styles.cardsLabel}>
                  <Icon color={HUB_COLORS.textMuted} name="cards" size={9} />
                  <Text style={styles.cardsText}>cartas: 0/100</Text>
                </View>
                <View style={styles.cardsTrack}>
                  <View style={[styles.cardsFill, { width: "0%" }]} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  nameBlock: {
    alignItems: "center",
    paddingTop: 2,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  heroName: {
    color: HUB_COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
  },
  statsCol: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  statLabel: {
    color: HUB_COLORS.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  statsValueRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  statValue: {
    color: HUB_COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 6,
  },
  speedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  speedTrack: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: 2,
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.pill,
    borderWidth: 1,
    flex: 1,
    height: 10,
    overflow: "hidden",
  },
  speedFill: {
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    height: "100%",
  },
  speedTag: {
    fontSize: 11,
    fontWeight: "900",
  },
  spriteCol: {
    alignItems: "center",
    justifyContent: "center",
    width: "46%",
  },
  spriteBox: {
    alignItems: "center",
    borderBottomWidth: HUB_DEPTH.raised,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 2,
    height: 160,
    justifyContent: "center",
    width: 130,
  },
  sprite: {
    height: 132,
    width: 116,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionSlot: {
    flex: 1,
  },
  passiveRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  passiveInfo: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  passiveIcon: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.panelAlt,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.flat,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  passiveText: {
    flex: 1,
  },
  passiveLabel: {
    color: HUB_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  passiveName: {
    color: HUB_COLORS.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 1,
  },
  rarityRow: {
    flexDirection: "row",
    gap: 6,
  },
  raritySlot: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.panelAlt,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.flat,
    borderColor: HUB_COLORS.grayDark,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    opacity: 0.75,
    position: "relative",
    width: 48,
  },
  rarityStars: {
    color: HUB_COLORS.textMuted,
    fontSize: 9,
    letterSpacing: -0.5,
  },
  rarityLock: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderColor: HUB_COLORS.grayDark,
    borderRadius: 6,
    borderWidth: 1,
    height: 13,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    top: 2,
    width: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 4,
  },
  gridCard: {
    backgroundColor: HUB_COLORS.card,
    borderBottomWidth: HUB_DEPTH.flat,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    flexDirection: "column",
    gap: 3,
    padding: 5,
    shadowColor: HUB_COLORS.yellow,
    width: "23%",
  },
  gridCardActive: {
    borderBottomWidth: 2,
    borderWidth: 2,
    elevation: 6,
    shadowOpacity: 0.7,
    shadowRadius: 7,
  },
  cardName: {
    color: HUB_COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  cardArt: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.panelAlt,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 1,
    height: 46,
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  cardImage: {
    height: 40,
    width: 35,
  },
  cardLock: {
    alignItems: "center",
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.55),
    borderRadius: HUB_RADIUS.small,
    bottom: 2,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    top: 2,
    width: 20,
  },
  levelBadge: {
    backgroundColor: HUB_COLORS.yellow,
    borderBottomColor: HUB_COLORS.amberDark,
    borderBottomWidth: 2,
    borderRadius: 4,
    bottom: 2,
    left: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    position: "absolute",
  },
  levelBadgeText: {
    color: HUB_COLORS.textDark,
    fontSize: 8,
    fontWeight: "900",
  },
  cardCost: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    height: 14,
    justifyContent: "center",
  },
  cardCostText: {
    color: HUB_COLORS.gem,
    fontSize: 10,
    fontWeight: "900",
  },
  cardCostEmpty: {
    height: 14,
  },
  cardsProgress: {
    gap: 2,
  },
  cardsLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
  },
  cardsText: {
    color: HUB_COLORS.textMuted,
    fontSize: 8,
    fontWeight: "800",
  },
  cardsTrack: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.pill,
    borderWidth: 1,
    height: 5,
    overflow: "hidden",
  },
  cardsFill: {
    backgroundColor: HUB_COLORS.amber,
    height: "100%",
  },
});