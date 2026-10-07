import { StyleSheet, Text, View } from "react-native";
import { type WeaponDef, type WeaponId } from "../catalog";
import { costOf, perkLevel, type Perk, type PerkId, type PerkLevels } from "../perks";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS } from "../theme";
import { Bevel } from "./Bevel";
import { Icon } from "./Icon";
import { PixelButton } from "./PixelButton";

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Bevel faceStyle={styles.panelFace} style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        {subtitle ? <Text style={styles.panelSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </Bevel>
  );
}

type PendingProps = {
  pending: string | null;
};

export function itemKey(kind: string, id: string) {
  return `${kind}-${id}`;
}

export function WeaponsPanel({
  weapons,
  gems,
  owned,
  equipped,
  onBuy,
  onEquip,
  pending,
}: PendingProps & {
  weapons: WeaponDef[];
  gems: number;
  owned: WeaponId[];
  equipped: WeaponId;
  onBuy: (id: WeaponId) => void;
  onEquip: (id: WeaponId) => void;
}) {
  return (
    <Panel subtitle="Desbloqueadas con gemas" title="ARMAMENTO">
      {weapons.map((weapon) => {
        const isOwned = owned.includes(weapon.id);
        const isEquipped = equipped === weapon.id;
        const disabled =
          isEquipped || (!isOwned && gems < weapon.cost) || pending === itemKey("weapon", weapon.id);
        return (
          <View key={weapon.id} style={styles.card}>
            <View style={[styles.swatch, { backgroundColor: weapon.color }]}>
              <Icon color={HUB_COLORS.textDark} name="rifle" size={20} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{weapon.label}</Text>
              <Text style={styles.cardDescription}>{weapon.description}</Text>
              <Text style={styles.cardStats}>
                DANO {weapon.stats.damage} · CAD {weapon.stats.fireRate}/s · x{weapon.stats.count}
              </Text>
            </View>
            <PixelButton
              compact
              disabled={disabled}
              label={isEquipped ? "EN USO" : isOwned ? "USAR" : `${weapon.cost} 💎`}
              onPress={() => (isOwned ? onEquip(weapon.id) : onBuy(weapon.id))}
            />
          </View>
        );
      })}
    </Panel>
  );
}

export function PerksPanel({
  perks,
  levels,
  coins,
  onBuy,
  pending,
}: PendingProps & {
  perks: Perk[];
  levels: PerkLevels;
  coins: number;
  onBuy: (id: PerkId) => void;
}) {
  return (
    <Panel subtitle="Mejoras permanentes con monedas" title="TALENTOS">
      {perks.map((perk) => {
        const current = perkLevel(levels, perk.id);
        const maxed = current >= perk.max;
        const cost = costOf(perk, current);
        const disabled = maxed || coins < cost || pending === itemKey("perk", perk.id);
        return (
          <View key={perk.id} style={styles.card}>
            <View style={styles.swatch}>
              <Icon color={HUB_COLORS.gem} name="dna" size={20} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                {perk.label} <Text style={styles.levelText}>{current}/{perk.max}</Text>
              </Text>
              <Text style={styles.cardDescription}>{perk.description}</Text>
            </View>
            <PixelButton
              compact
              disabled={disabled}
              label={maxed ? "MAX" : `${cost} 🪙`}
              onPress={() => onBuy(perk.id)}
              variant={maxed ? "dark" : "primary"}
            />
          </View>
        );
      })}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: {},
  panelFace: {
    gap: 10,
    padding: 14,
  },
  panelHeader: {
    gap: 2,
  },
  panelTitle: {
    color: HUB_COLORS.yellow,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  panelSubtitle: {
    color: HUB_COLORS.textMuted,
    fontSize: 11,
  },
  card: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.card,
    borderBottomColor: HUB_COLORS.backgroundDeep,
    borderBottomWidth: HUB_DEPTH.flat,
    borderColor: HUB_COLORS.cardBorder,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: HUB_COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  cardDescription: {
    color: HUB_COLORS.textMuted,
    fontSize: 11,
  },
  cardStats: {
    color: HUB_COLORS.gem,
    fontSize: 10,
    fontWeight: "800",
  },
  swatch: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.panelAlt,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.flat,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  levelText: {
    color: HUB_COLORS.gem,
    fontSize: 12,
  },
});
