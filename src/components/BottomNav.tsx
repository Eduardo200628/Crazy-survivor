import { Pressable, StyleSheet, Text, View } from "react-native";
import { HUB_TABS, type HubTabId } from "../catalog";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS } from "../theme";
import { Icon } from "./Icon";

type Props = {
  active: HubTabId;
  onChange: (id: HubTabId) => void;
  shopBadge?: boolean;
};

export function BottomNav({ active, onChange, shopBadge = false }: Props) {
  return (
    <View style={styles.nav}>
      <View style={styles.rail} />
      <View style={styles.row}>
        {HUB_TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={({ pressed }) => [
                styles.item,
                { opacity: pressed ? 0.7 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
              ]}
            >
              <View style={[styles.iconWrap, selected && styles.iconWrapActive]}>
                <Icon
                  color={selected ? HUB_COLORS.text : HUB_COLORS.textMuted}
                  name={tab.icon}
                  size={21}
                />
                {tab.id === "shop" && shopBadge ? <View style={styles.badge} /> : null}
              </View>
              <Text numberOfLines={1} style={[styles.label, selected && styles.labelActive]}>
                {tab.label}
              </Text>
              {selected ? <View style={styles.indicator} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: HUB_COLORS.panel,
    paddingBottom: 8,
  },
  rail: {
    backgroundColor: HUB_COLORS.panelBorder,
    height: 2,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 3,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: HUB_RADIUS.medium,
    height: 32,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  iconWrapActive: {
    backgroundColor: HUB_COLORS.blue,
    borderBottomColor: HUB_COLORS.blueDark,
    borderBottomWidth: HUB_DEPTH.flat + 1,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
  },
  badge: {
    backgroundColor: HUB_COLORS.danger,
    borderColor: HUB_COLORS.panel,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    right: 2,
    top: -2,
    width: 12,
  },
  label: {
    color: HUB_COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  labelActive: {
    color: HUB_COLORS.blueLight,
  },
  indicator: {
    backgroundColor: HUB_COLORS.blueLight,
    borderRadius: 2,
    height: 3,
    marginTop: 1,
    width: 18,
  },
});
