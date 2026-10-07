import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HUB_COLORS, HUB_RADIUS, withAlpha } from "../theme";
import { Icon, type IconName } from "./Icon";

export type MenuOptionId = "inventory" | "achievements" | "skills" | "settings";

type MenuOption = {
  id: MenuOptionId;
  label: string;
  icon: IconName;
};

const OPTIONS: MenuOption[] = [
  { id: "inventory", label: "Inventario", icon: "backpack" },
  { id: "achievements", label: "Logros", icon: "trophy" },
  { id: "skills", label: "Código de habilidades", icon: "bolt" },
  { id: "settings", label: "Ajustes", icon: "gear" },
];

type Props = {
  top: number;
  left: number;
  onSelect: (id: MenuOptionId) => void;
  onClose: () => void;
};

export function MenuDropdown({ top, left, onSelect, onClose }: Props) {
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />

      <View style={[styles.panel, { left, top }]}>
        {OPTIONS.map((option, index) => (
          <Fragment key={option.id}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <View style={styles.optionIcon}>
                <Icon color={HUB_COLORS.yellow} name={option.icon} size={20} />
              </View>
              <Text numberOfLines={1} style={styles.optionLabel}>
                {option.label}
              </Text>
            </Pressable>
            {index < OPTIONS.length - 1 ? <View style={styles.separator} /> : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 50,
  },
  backdrop: {
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.4),
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  panel: {
    backgroundColor: withAlpha(HUB_COLORS.backgroundDeep, 0.92),
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 1,
    elevation: 12,
    maxWidth: 300,
    minWidth: 240,
    overflow: "hidden",
    paddingVertical: 4,
    shadowColor: HUB_COLORS.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    width: 260,
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  optionPressed: {
    backgroundColor: withAlpha(HUB_COLORS.panelBorder, 0.55),
  },
  optionIcon: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  optionLabel: {
    color: HUB_COLORS.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  separator: {
    backgroundColor: withAlpha(HUB_COLORS.panelBorder, 0.9),
    height: 1,
    marginHorizontal: 14,
  },
});
