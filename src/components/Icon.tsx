import { Text, View } from "react-native";
import type { HubIcon, RewardIcon } from "../catalog";
import { HUB_COLORS } from "../theme";

export type IconName =
  | HubIcon
  | RewardIcon
  | "menu"
  | "plus"
  | "chest"
  | "gem"
  | "lock"
  | "check"
  | "star"
  | "info"
  | "target"
  | "user"
  | "backpack"
  | "trophy"
  | "bolt"
  | "gear"
  | "heart"
  | "play"
  | "shield"
  | "cards";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = HUB_COLORS.text }: Props) {
  const thickness = Math.max(2, Math.round(size * 0.13));
  const gap = Math.max(2, Math.round(size * 0.2));

  if (name === "menu") {
    return (
      <View style={{ gap, width: size }}>
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            style={{
              backgroundColor: color,
              borderRadius: thickness,
              height: thickness,
              width: row === 2 ? size * 0.68 : size,
            }}
          />
        ))}
      </View>
    );
  }

  if (name === "plus") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness,
            position: "absolute",
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size,
            position: "absolute",
            width: thickness,
          }}
        />
      </View>
    );
  }

  if (name === "coin") {
    return (
      <View
        style={{
          alignItems: "center",
          borderColor: color,
          borderRadius: size / 2,
          borderWidth: thickness,
          height: size,
          justifyContent: "center",
          width: size,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.46,
            width: thickness,
          }}
        />
      </View>
    );
  }

  if (name === "ammo") {
    return (
      <View style={{ alignItems: "center", flexDirection: "row", gap, height: size, width: size }}>
        {[0, 1, 2].map((round) => (
          <View
            key={round}
            style={{
              backgroundColor: color,
              borderRadius: thickness,
              height: size * 0.72,
              width: thickness * 1.4,
            }}
          />
        ))}
      </View>
    );
  }

  if (name === "book") {
    return (
      <View
        style={{
          backgroundColor: color,
          borderRadius: thickness,
          height: size * 0.86,
          justifyContent: "center",
          width: size * 0.78,
        }}
      >
        <View
          style={{
            backgroundColor: HUB_COLORS.textDark,
            height: "82%",
            left: "22%",
            position: "absolute",
            width: thickness,
          }}
        />
      </View>
    );
  }

  if (name === "cart") {
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness,
            left: size * 0.08,
            position: "absolute",
            top: size * 0.18,
            transform: [{ rotate: "-18deg" }],
            width: size * 0.4,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: thickness,
            borderBottomRightRadius: thickness,
            borderTopWidth: 0,
            height: size * 0.42,
            left: size * 0.2,
            position: "absolute",
            top: size * 0.3,
            width: size * 0.74,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.9,
            bottom: size * 0.06,
            height: thickness * 1.6,
            left: size * 0.32,
            position: "absolute",
            width: thickness * 1.6,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.9,
            bottom: size * 0.06,
            height: thickness * 1.6,
            position: "absolute",
            right: size * 0.18,
            width: thickness * 1.6,
          }}
        />
      </View>
    );
  }

  if (name === "helmet") {
    return (
      <View style={{ height: size, justifyContent: "flex-end", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderTopLeftRadius: size / 2,
            borderTopRightRadius: size / 2,
            height: size * 0.62,
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness,
            marginTop: -thickness,
            width: size,
          }}
        />
      </View>
    );
  }

  if (name === "rifle") {
    return (
      <View style={{ height: size, justifyContent: "center", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness * 1.2,
            left: size * 0.1,
            position: "absolute",
            top: size * 0.3,
            width: size * 0.84,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: thickness * 2,
            borderTopLeftRadius: thickness,
            height: size * 0.34,
            left: 0,
            position: "absolute",
            top: size * 0.24,
            width: size * 0.28,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: thickness,
            height: size * 0.3,
            left: size * 0.42,
            position: "absolute",
            top: size * 0.44,
            transform: [{ rotate: "18deg" }],
            width: thickness * 1.6,
          }}
        />
      </View>
    );
  }

  if (name === "dna") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: size * 0.1,
            height: size * 0.9,
            justifyContent: "space-between",
            transform: [{ rotate: "-18deg" }],
            width: size * 0.62,
          }}
        >
          <View
            style={{
              backgroundColor: color,
              borderRadius: thickness,
              height: size * 0.88,
              width: thickness,
            }}
          />
          <View
            style={{
              backgroundColor: color,
              borderRadius: thickness,
              height: size * 0.88,
              width: thickness,
            }}
          />
        </View>
        <View
          style={{
            backgroundColor: color,
            height: thickness,
            left: size * 0.16,
            position: "absolute",
            top: "26%",
            width: size * 0.68,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            height: thickness,
            left: size * 0.16,
            position: "absolute",
            top: "52%",
            width: size * 0.68,
          }}
        />
      </View>
    );
  }

  if (name === "map") {
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            flexDirection: "row",
            gap: size * 0.06,
            height: size * 0.66,
            left: 0,
            position: "absolute",
            top: size * 0.16,
            width: size,
          }}
        >
          <View style={{ backgroundColor: HUB_COLORS.textDark, flex: 1, opacity: 0.35 }} />
          <View style={{ backgroundColor: HUB_COLORS.textDark, flex: 1, opacity: 0.35 }} />
          <View style={{ backgroundColor: HUB_COLORS.textDark, flex: 1, opacity: 0.35 }} />
        </View>
        <View
          style={{
            backgroundColor: HUB_COLORS.danger,
            borderColor: color,
            borderRadius: size * 0.16,
            borderWidth: thickness,
            height: size * 0.3,
            left: size * 0.3,
            position: "absolute",
            top: size * 0.1,
            width: size * 0.3,
          }}
        />
      </View>
    );
  }

  if (name === "chest") {
    return (
      <View style={{ height: size, justifyContent: "flex-end", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderTopLeftRadius: size * 0.3,
            borderTopRightRadius: size * 0.3,
            height: size * 0.36,
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: thickness,
            borderBottomRightRadius: thickness,
            height: size * 0.46,
            width: size,
          }}
        />
        <View
          style={{
            backgroundColor: HUB_COLORS.yellow,
            borderRadius: thickness,
            height: size * 0.22,
            left: size * 0.38,
            position: "absolute",
            top: size * 0.36,
            width: size * 0.24,
          }}
        />
      </View>
    );
  }

  if (name === "gem") {
    return (
      <View
        style={{
          alignItems: "center",
          height: size,
          justifyContent: "center",
          width: size,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.66,
            transform: [{ rotate: "45deg" }],
            width: size * 0.66,
          }}
        />
        <View
          style={{
            backgroundColor: HUB_COLORS.textDark,
            height: size * 0.18,
            opacity: 0.35,
            transform: [{ rotate: "45deg" }],
            width: size * 0.3,
          }}
        />
      </View>
    );
  }

  if (name === "lock") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "flex-end", width: size }}>
        <View
          style={{
            borderColor: color,
            borderRadius: size * 0.3,
            borderTopWidth: thickness * 1.4,
            borderLeftWidth: thickness * 1.4,
            borderRightWidth: thickness * 1.4,
            height: size * 0.4,
            width: size * 0.56,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.42,
            width: size * 0.72,
          }}
        />
      </View>
    );
  }

  if (name === "check") {
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness * 1.6,
            left: size * 0.08,
            position: "absolute",
            top: size * 0.52,
            transform: [{ rotate: "45deg" }],
            width: size * 0.42,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: thickness * 1.6,
            left: size * 0.32,
            position: "absolute",
            top: size * 0.34,
            transform: [{ rotate: "-45deg" }],
            width: size * 0.62,
          }}
        />
      </View>
    );
  }

  if (name === "target") {
    return (
      <View
        style={{
          alignItems: "center",
          borderColor: color,
          borderRadius: size / 2,
          borderWidth: thickness,
          height: size,
          justifyContent: "center",
          width: size,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            borderRadius: size * 0.14,
            height: size * 0.28,
            width: size * 0.28,
          }}
        />
      </View>
    );
  }

  if (name === "user") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "flex-end", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: size * 0.24,
            height: size * 0.42,
            width: size * 0.48,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderTopLeftRadius: size * 0.3,
            borderTopRightRadius: size * 0.3,
            height: size * 0.3,
            width: size * 0.86,
          }}
        />
      </View>
    );
  }

  if (name === "sparkle") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.34,
            position: "absolute",
            transform: [{ rotate: "45deg" }],
            width: size * 0.34,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.34,
            position: "absolute",
            transform: [{ rotate: "45deg" }],
            width: size * 0.34,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness,
            height: size * 0.18,
            position: "absolute",
            transform: [{ rotate: "45deg" }],
            width: size * 0.18,
          }}
        />
      </View>
    );
  }

  if (name === "star") {
    return (
      <Text style={{ color, fontSize: size, lineHeight: size * 1.1 }}>★</Text>
    );
  }

  if (name === "heart") {
    return (
      <Text style={{ color, fontSize: size, lineHeight: size * 1.15 }}>♥</Text>
    );
  }

  if (name === "play") {
    return (
      <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
        <View
          style={{
            borderBottomColor: "transparent",
            borderBottomWidth: size * 0.42,
            borderLeftColor: color,
            borderLeftWidth: size * 0.62,
            borderTopColor: "transparent",
            borderTopWidth: size * 0.42,
            height: 0,
            width: 0,
          }}
        />
      </View>
    );
  }

  if (name === "shield") {
    return (
      <View style={{ alignItems: "center", height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderTopLeftRadius: thickness,
            borderTopRightRadius: thickness,
            height: size * 0.56,
            width: size * 0.76,
          }}
        />
        <View
          style={{
            borderBottomColor: color,
            borderBottomWidth: size * 0.44,
            borderLeftColor: "transparent",
            borderLeftWidth: size * 0.38,
            borderRightColor: "transparent",
            borderRightWidth: size * 0.38,
            height: 0,
            width: 0,
          }}
        />
      </View>
    );
  }

  if (name === "cards") {
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.6,
            height: size * 0.72,
            left: size * 0.02,
            opacity: 0.55,
            position: "absolute",
            top: size * 0.22,
            transform: [{ rotate: "-14deg" }],
            width: size * 0.62,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.6,
            height: size * 0.72,
            left: size * 0.34,
            position: "absolute",
            top: size * 0.06,
            width: size * 0.62,
          }}
        />
        <View
          style={{
            backgroundColor: HUB_COLORS.textDark,
            height: size * 0.4,
            left: size * 0.48,
            opacity: 0.4,
            position: "absolute",
            top: size * 0.22,
            width: thickness,
          }}
        />
      </View>
    );
  }

  if (name === "backpack") {
    const bodyWidth = size * 0.84;
    const bodyHeight = size * 0.78;
    const bodyLeft = (size - bodyWidth) / 2;
    const bodyTop = size * 0.18;
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            borderColor: color,
            borderBottomWidth: 0,
            borderRadius: thickness * 1.4,
            borderLeftWidth: thickness,
            borderRightWidth: thickness,
            borderTopWidth: thickness,
            height: size * 0.2,
            left: size * 0.34,
            position: "absolute",
            top: 0,
            width: size * 0.32,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: size * 0.14,
            borderBottomRightRadius: size * 0.14,
            borderTopLeftRadius: size * 0.24,
            borderTopRightRadius: size * 0.24,
            height: bodyHeight,
            left: bodyLeft,
            position: "absolute",
            top: bodyTop,
            width: bodyWidth,
          }}
        />
        <View
          style={{
            backgroundColor: HUB_COLORS.textDark,
            height: Math.max(1, Math.round(thickness * 0.8)),
            left: bodyLeft,
            opacity: 0.5,
            position: "absolute",
            top: bodyTop + size * 0.24,
            width: bodyWidth,
          }}
        />
        <View
          style={{
            backgroundColor: HUB_COLORS.textDark,
            borderRadius: thickness * 0.5,
            height: size * 0.1,
            left: size * 0.44,
            opacity: 0.8,
            position: "absolute",
            top: bodyTop + size * 0.2,
            width: size * 0.12,
          }}
        />
        <View
          style={{
            borderColor: HUB_COLORS.textDark,
            borderRadius: size * 0.07,
            borderWidth: Math.max(1, Math.round(thickness * 0.7)),
            height: size * 0.3,
            left: bodyLeft + size * 0.13,
            opacity: 0.7,
            position: "absolute",
            top: bodyTop + size * 0.38,
            width: bodyWidth - size * 0.26,
          }}
        />
      </View>
    );
  }

  if (name === "trophy") {
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            borderColor: color,
            borderRadius: size * 0.16,
            borderWidth: thickness,
            height: size * 0.3,
            left: size * 0.02,
            position: "absolute",
            top: size * 0.16,
            width: size * 0.3,
          }}
        />
        <View
          style={{
            borderColor: color,
            borderRadius: size * 0.16,
            borderWidth: thickness,
            height: size * 0.3,
            position: "absolute",
            right: size * 0.02,
            top: size * 0.16,
            width: size * 0.3,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderBottomLeftRadius: size * 0.26,
            borderBottomRightRadius: size * 0.26,
            height: size * 0.46,
            left: size * 0.17,
            position: "absolute",
            top: size * 0.1,
            width: size * 0.66,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            height: size * 0.22,
            left: size * 0.43,
            position: "absolute",
            top: size * 0.54,
            width: size * 0.14,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.6,
            height: size * 0.13,
            left: size * 0.2,
            position: "absolute",
            top: size * 0.76,
            width: size * 0.6,
          }}
        />
      </View>
    );
  }

  if (name === "bolt") {
    const barWidth = size * 0.26;
    const barHeight = size * 0.56;
    return (
      <View style={{ height: size, width: size }}>
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.7,
            height: barHeight,
            left: size * 0.62 - barWidth / 2,
            position: "absolute",
            top: size * 0.32 - barHeight / 2,
            transform: [{ rotate: "28deg" }],
            width: barWidth,
          }}
        />
        <View
          style={{
            backgroundColor: color,
            borderRadius: thickness * 0.7,
            height: barHeight,
            left: size * 0.38 - barWidth / 2,
            position: "absolute",
            top: size * 0.68 - barHeight / 2,
            transform: [{ rotate: "28deg" }],
            width: barWidth,
          }}
        />
      </View>
    );
  }

  if (name === "gear") {
    const ring = size * 0.6;
    const toothLength = size * 0.22;
    const toothCenter = ring / 2 + toothLength * 0.22;
    return (
      <View style={{ height: size, width: size }}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const centerX = size / 2 + toothCenter * Math.cos(rad);
          const centerY = size / 2 + toothCenter * Math.sin(rad);
          return (
            <View
              key={angle}
              style={{
                backgroundColor: color,
                borderRadius: thickness * 0.5,
                height: thickness,
                left: centerX - toothLength / 2,
                position: "absolute",
                top: centerY - thickness / 2,
                transform: [{ rotate: `${angle}deg` }],
                width: toothLength,
              }}
            />
          );
        })}
        <View
          style={{
            borderColor: color,
            borderRadius: ring / 2,
            borderWidth: thickness,
            height: ring,
            left: (size - ring) / 2,
            position: "absolute",
            top: (size - ring) / 2,
            width: ring,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        borderColor: color,
        borderRadius: size / 2,
        borderWidth: thickness,
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <Text style={{ color, fontSize: size * 0.62, fontWeight: "900" }}>i</Text>
    </View>
  );
}
