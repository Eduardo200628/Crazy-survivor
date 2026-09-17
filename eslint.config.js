const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  ...expoConfig,
  {
    files: ["**/GameScreen.tsx"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
]);