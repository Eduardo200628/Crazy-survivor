import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS } from "../theme";

type Props = {
  children: ReactNode;
  color?: string;
  bevelColor?: string;
  rimColor?: string;
  depth?: number;
  radius?: number;
  gloss?: boolean;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
};

export function Bevel({
  children,
  color = HUB_COLORS.panel,
  bevelColor = HUB_COLORS.shadow,
  rimColor = HUB_COLORS.panelBorder,
  depth = HUB_DEPTH.raised,
  radius = HUB_RADIUS.large,
  gloss = true,
  style,
  faceStyle,
}: Props) {
  return (
    <View
      style={[
        styles.shadow,
        {
          backgroundColor: bevelColor,
          borderBottomLeftRadius: radius * 0.6,
          borderBottomRightRadius: radius * 0.35,
          paddingBottom: depth,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.face,
          {
            backgroundColor: color,
            borderColor: rimColor,
            borderRadius: radius,
            borderTopColor: gloss ? HUB_COLORS.gloss : rimColor,
          },
          faceStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderTopLeftRadius: HUB_RADIUS.large,
    borderTopRightRadius: HUB_RADIUS.large,
  },
  face: {
    borderBottomWidth: 0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 2,
    overflow: "hidden",
  },
});
