import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { DROP_SPRITES } from "../sprites";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS, withAlpha } from "../theme";
import { Bevel } from "./Bevel";
import { Icon } from "./Icon";

export const MENU_BUTTON_LAYOUT = {
  size: 42,
  offsetX: 14,
  offsetY: 8,
  gap: 8,
};

type ResourceChipProps = {
  sprite: ImageSourcePropType;
  value: number;
  onPress: () => void;
};

function ResourceChip({ sprite, value, onPress }: ResourceChipProps) {
  return (
    <Bevel
      bevelColor={HUB_COLORS.shadow}
      color={HUB_COLORS.panel}
      depth={HUB_DEPTH.flat}
      radius={HUB_RADIUS.pill}
      rimColor={HUB_COLORS.panelBorder}
      style={styles.chipSlot}
    >
      <View style={styles.chip}>
        <Image source={sprite} style={styles.chipSprite} />
        <Text numberOfLines={1} style={styles.chipValue}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.chipPlus,
            {
              backgroundColor: pressed ? HUB_COLORS.yellowDark : HUB_COLORS.yellow,
              borderBottomColor: pressed ? HUB_COLORS.amberDark : HUB_COLORS.amberDark,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Icon color={HUB_COLORS.textDark} name="plus" size={14} />
        </Pressable>
      </View>
    </Bevel>
  );
}

type Props = {
  coins: number;
  gems: number;
  level: number;
  levelProgress: number;
  onOpenMenu: () => void;
  onAddCoins: () => void;
  onAddGems: () => void;
  onInfo?: () => void;
};

export function TopBar({
  coins,
  gems,
  level,
  levelProgress,
  onOpenMenu,
  onAddCoins,
  onAddGems,
  onInfo,
}: Props) {
  const progress = Math.max(0, Math.min(1, levelProgress));

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenMenu}
          style={({ pressed }) => [
            styles.menu,
            {
              backgroundColor: pressed ? HUB_COLORS.panelAlt : HUB_COLORS.panel,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          <Icon color={HUB_COLORS.yellow} name="menu" size={20} />
        </Pressable>

        <View style={styles.chips}>
          <ResourceChip onPress={onAddGems} sprite={DROP_SPRITES.gem} value={gems} />
          <ResourceChip onPress={onAddCoins} sprite={DROP_SPRITES.coin} value={coins} />
        </View>

        {onInfo ? (
          <Pressable
            accessibilityRole="button"
            onPress={onInfo}
            style={({ pressed }) => [
              styles.menu,
              {
                backgroundColor: pressed ? HUB_COLORS.panelAlt : HUB_COLORS.panel,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}
          >
            <Icon color={HUB_COLORS.yellow} name="info" size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>NIVEL {level}</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              {
                backgroundColor: HUB_COLORS.amber,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.levelValue}>Lv.{level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    paddingHorizontal: MENU_BUTTON_LAYOUT.offsetX,
    paddingTop: MENU_BUTTON_LAYOUT.offsetY,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  menu: {
    alignItems: "center",
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.raised,
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 1,
    height: MENU_BUTTON_LAYOUT.size,
    justifyContent: "center",
    width: MENU_BUTTON_LAYOUT.size,
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  chipSlot: {
    flex: 1,
  },
  chip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    height: 40,
    paddingHorizontal: 10,
  },
  chipSprite: {
    height: 20,
    width: 20,
  },
  chipValue: {
    color: HUB_COLORS.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  chipPlus: {
    alignItems: "center",
    borderBottomColor: HUB_COLORS.amberDark,
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  levelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  levelLabel: {
    color: HUB_COLORS.textMuted,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  track: {
    backgroundColor: HUB_COLORS.backgroundDeep,
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: 2,
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.pill,
    borderWidth: 1,
    flex: 1,
    height: 12,
    overflow: "hidden",
  },
  trackFill: {
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: withAlpha(HUB_COLORS.yellowLight, 0.6),
    borderTopWidth: 2,
    height: "100%",
  },
  levelValue: {
    color: HUB_COLORS.yellow,
    fontSize: 11,
    fontWeight: "900",
  },
});
