# @swiftwasm/swift-webpack-plugin

webpack plugin for Swift

## Installation

```sh
npm install -D @swiftwasm/swift-webpack-plugin
```

## Usage

Please see [example project](https://github.com/kateinoigakukun/life-game-with-swiftwasm/blob/master/webpack.config.js)

```javascript
const path = require('path');
const SwiftWebpackPlugin = require('@swiftwasm/swift-webpack-plugin')

module.exports = {
  plugins: [
    new SwiftWebpackPlugin({
      packageDirectory: path.join(__dirname, 'LifeGame'),
      target: 'LifeGameWeb',
      dist: path.join(__dirname, "dist")
    }),
  ],
};
```
