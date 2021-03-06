const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = function post(common_config) {
  return [
    // MAIN
    Object.assign({}, common_config, {
      target: "electron-main",
      entry: {
        main: "./src/main/index.ts",
      },
      output: {
        filename: "main.js",
        path: path.join(__dirname, "lib"),
      },
    }),
    // RENDERER
    Object.assign({}, common_config, {
      target: "electron-renderer",
      entry: {
        renderer: "./src/renderer/index.tsx",
      },
      output: {
        filename: "index.js",
        path: path.join(__dirname, "lib/renderer"),
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: "[name].[hash].css",
          chunkFilename: "[id].[hash].css",
        }),
        new HtmlWebpackPlugin({
          template: "src/assets/template.html",
        }),
      ],
    }),
    // BACKGROUND
    Object.assign({}, common_config, {
      target: "electron-renderer",
      entry: {
        renderer: "./src/background/index.ts",
      },
      output: {
        filename: "index.js",
        path: path.join(__dirname, "lib/background"),
      },
      plugins: [
        // Background should not require this
        new MiniCssExtractPlugin({
          filename: "[name].[hash].css",
          chunkFilename: "[id].[hash].css",
        }),
        new HtmlWebpackPlugin({
          template: "src/assets/template.html",
        }),
      ],
    }),
    // OVERLAY
    Object.assign({}, common_config, {
      target: "electron-renderer",
      entry: {
        renderer: "./src/overlay/index.tsx",
      },
      output: {
        filename: "index.js",
        path: path.join(__dirname, "lib/overlay"),
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: "[name].[hash].css",
          chunkFilename: "[id].[hash].css",
        }),
        new HtmlWebpackPlugin({
          template: "src/assets/template.html",
        }),
      ],
    }),
    // UPDATER
    Object.assign({}, common_config, {
      target: "electron-renderer",
      entry: {
        renderer: "./src/updater/index.tsx",
      },
      output: {
        filename: "index.js",
        path: path.join(__dirname, "lib/updater"),
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: "[name].[hash].css",
          chunkFilename: "[id].[hash].css",
        }),
        new HtmlWebpackPlugin({
          template: "src/assets/template.html",
        }),
      ],
    }),
  ];
};
