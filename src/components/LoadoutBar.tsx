import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { levelOfCost, starsOfCost, type CharacterDef, type WeaponDef } from "../catalog";
import { PLAYER_SPRITE } from "../sprites";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS } from "../theme";
import { Bevel } from "./Bevel";
import { Icon } from "./Icon";

type Props = {
  character: CharacterDef;
  weapon: WeaponDef;
  onChangeCharacter: () => void;
  onChangeWeapon: () => void;
  onInfo: () => void;
};

type StarsProps = {
  count: number;
  color: string;
};

function Stars({ count, color }: StarsProps) {
  return (
    <View style={styles.stars}>
      {[0, 1, 2].map((position) => (
        <Text
          key={position}
          style={{ color: position < count ? color : HUB_COLORS.grayDark, fontSize: 11 }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

type SlotProps = {
  accent: string;
  label: string;
  level: number;
  stars: number;
  onChange: () => void;
  avatar: React.ReactNode;
};

function Slot({ accent, label, level, stars, onChange, avatar }: SlotProps) {
  return (
    <View style={styles.slot}>
      <View style={[styles.avatar, { borderBottomColor: HUB_COLORS.shadow, borderColor: accent }]}>
        {avatar}
      </View>
      <View style={styles.slotBody}>
        <Text numberOfLines={1} style={styles.slotLabel}>
          {label}
        </Text>
        <View style={styles.slotMeta}>
          <Text style={styles.slotLevel}>Nv.{level}</Text>
          <Stars color={HUB_COLORS.yellow} count={stars} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onChange}
          style={({ pressed }) => [
            styles.changeButton,
            {
              backgroundColor: pressed ? HUB_COLORS.blueDark : HUB_COLORS.blue,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          <Text style={styles.changeButtonText}>Cambiar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LoadoutBar({
  character,
  weapon,
  onChangeCharacter,
  onChangeWeapon,
  onInfo,
}: Props) {
  return (
    <Bevel faceStyle={styles.barFace} style={styles.bar}>
      <Slot
        accent={character.accent}
        avatar={
          <Image
            resizeMode="contain"
            source={PLAYER_SPRITE}
            style={styles.avatarImage}
          />
        }
        label={character.label}
        level={levelOfCost(character.cost)}
        onChange={onChangeCharacter}
        stars={starsOfCost(character.cost)}
      />

      <View style={styles.divider} />

      <Slot
        accent={weapon.color}
        avatar={<Icon color={HUB_COLORS.textDark} name="rifle" size={22} />}
        label={weapon.label}
        level={levelOfCost(weapon.cost)}
        onChange={onChangeWeapon}
        stars={starsOfCost(weapon.cost)}
      />

      <Pressable
        accessibilityRole="button"
        onPress={onInfo}
        style={({ pressed }) => [
          styles.info,
          {
            backgroundColor: pressed ? HUB_COLORS.card : HUB_COLORS.panelAlt,
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}
      >
        <Icon color={HUB_COLORS.yellow} name="info" size={18} />
      </Pressable>
    </Bevel>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 14,
  },
  barFace: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  slot: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  slotBody: {
    flex: 1,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.panelAlt,
    borderBottomWidth: HUB_DEPTH.flat,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarImage: {
    height: 34,
    width: 30,
  },
  slotLabel: {
    color: HUB_COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  slotMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 1,
  },
  slotLevel: {
    color: HUB_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  stars: {
    flexDirection: "row",
    gap: 1,
  },
  changeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderBottomColor: HUB_COLORS.blueDark,
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.small,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 1,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  changeButtonText: {
    color: HUB_COLORS.text,
    fontSize: 10,
    fontWeight: "900",
  },
  divider: {
    backgroundColor: HUB_COLORS.panelBorder,
    height: 52,
    width: 1,
  },
  info: {
    alignItems: "center",
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: HUB_DEPTH.flat,
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
});
