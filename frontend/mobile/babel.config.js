module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["module-resolver", {
        root: ["."],
        alias: {
          "@": "./src",
        },
      }],
      // expo-router/babel was folded into babel-preset-expo in SDK 50.
      "react-native-reanimated/plugin"
    ],
  };
};