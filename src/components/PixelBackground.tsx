import { useWindowDimensions, View } from "react-native";
import { HUB_COLORS } from "../theme";

const CELL = 38;

export function PixelBackground() {
  const { width, height } = useWindowDimensions();

  const columns = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const cells = [];

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const dark = (column + row) % 2 === 0;
      cells.push(
        <View
          key={`${column}-${row}`}
          style={{
            backgroundColor: dark ? HUB_COLORS.background : HUB_COLORS.backgroundAlt,
            height: CELL,
            opacity: dark ? 0.85 : 0.6,
            width: CELL,
          }}
        />,
      );
    }
  }

  return (
    <View pointerEvents="none" style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}>
      <View style={{ backgroundColor: HUB_COLORS.backgroundDeep, bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }} />
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{cells}</View>
      <View
        style={{
          backgroundColor: HUB_COLORS.haze,
          height: Math.round(height * 0.42),
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />
      <View
        style={{
          backgroundColor: HUB_COLORS.shadowSoft,
          bottom: 0,
          height: Math.round(height * 0.3),
          left: 0,
          position: "absolute",
          right: 0,
        }}
      />
    </View>
  );
}
