import { Pressable, StyleSheet, Text, View } from "react-native";
import { HUB_COLORS, HUB_RADIUS } from "../theme";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost" | "dark" | "orange";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  compact?: boolean;
  sublabel?: string;
  fullWidth?: boolean;
};

const PALETTE: Record<Variant, { background: string; border: string; text: string }> = {
  primary: { background: HUB_COLORS.yellow, border: HUB_COLORS.amberDark, text: HUB_COLORS.textDark },
  secondary: { background: HUB_COLORS.blue, border: HUB_COLORS.blueDark, text: HUB_COLORS.text },
  success: { background: HUB_COLORS.success, border: HUB_COLORS.successDark, text: HUB_COLORS.textDark },
  danger: { background: HUB_COLORS.danger, border: HUB_COLORS.dangerDark, text: HUB_COLORS.text },
  ghost: { background: HUB_COLORS.panelAlt, border: HUB_COLORS.shadow, text: HUB_COLORS.text },
  dark: { background: HUB_COLORS.grayDark, border: HUB_COLORS.backgroundDeep, text: HUB_COLORS.text },
  orange: { background: HUB_COLORS.orange, border: HUB_COLORS.orangeDark, text: HUB_COLORS.textDark },
};

export function PixelButton({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled = false,
  compact = false,
  sublabel,
  fullWidth = false,
}: Props) {
  const colors = PALETTE[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        fullWidth && styles.buttonFull,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: pressed && !disabled ? 2 : compact ? 3 : 5,
          borderTopColor: HUB_COLORS.gloss,
          opacity: disabled ? 0.5 : 1,
          transform: [{ translateY: pressed && !disabled ? 2 : 0 }],
        },
      ]}
    >
      <View style={styles.content}>
        {icon ? <Icon color={colors.text} name={icon} size={compact ? 16 : 20} /> : null}
        <View style={styles.labels}>
          <Text
            numberOfLines={1}
            style={[styles.label, compact && styles.labelCompact, { color: colors.text }]}
          >
            {label}
          </Text>
          {sublabel ? (
            <Text numberOfLines={1} style={[styles.sublabel, { color: colors.text }]}>
              {sublabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderBottomLeftRadius: HUB_RADIUS.medium,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: HUB_RADIUS.medium,
    borderTopRightRadius: HUB_RADIUS.medium,
    borderTopWidth: 2,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonCompact: {
    borderBottomLeftRadius: HUB_RADIUS.small,
    borderBottomRightRadius: 3,
    borderTopLeftRadius: HUB_RADIUS.small,
    borderTopRightRadius: HUB_RADIUS.small,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonFull: {
    alignSelf: "stretch",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  labels: {
    alignItems: "center",
  },
  label: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1,
  },
  labelCompact: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  sublabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
    opacity: 0.85,
  },
});
