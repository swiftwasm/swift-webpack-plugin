const path = require('path');
const SwiftWebpackPlugin = require('@swiftwasm/swift-webpack-plugin')

const outputPath = path.resolve(__dirname, 'dist');

module.exports = {
  entry: "./index.js",
  output: {
    filename: 'main.js',
    path: outputPath,
  },
  plugins: [
    new SwiftWebpackPlugin({
      packageDirectory: __dirname,
      target: 'Example',
      dist: outputPath,
      config: 'debug'
    }),
  ],
};
