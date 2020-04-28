const path = require('path');
const { spawn } = require('child_process');
const Watchpack = require('watchpack');
const log = msg => console.log("[swift-webpack-plugin] ", msg);

function runProcess(bin, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, options);
    let errorMessage = "";

    p.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        const cmd = [bin].concat(args).join(" ")
        reject(new Error(`Failed to execute: ${cmd}\n${errorMessage}`));
      }
    });
    p.stderr.on('data', (data) => {
      errorMessage += data.toString() + "\n";
    });
    p.stdout.on('data', (data) => {
      errorMessage += data.toString() + "\n";
    });
    p.on('error', reject);
  });
}

class SwiftWebpackPlugin {
  constructor(options) {
    this.packageDirectory = options.packageDirectory
    this.target = options.target
    this.dist = options.dist
    this.buildDirectory = path.join(this.packageDirectory, ".build")
    this.wp = new Watchpack({
      ignored: [this.buildDirectory],
    });
  }
  apply(compiler) {
    compiler.hooks.watchRun.tap("SwiftWebpackPlugin", () => {
      log("Watching " + this.packageDirectory)
      this.wp.watch([], [this.packageDirectory], Date.now() - 10000);
      this.wp.on('change', () => this._compile())
    })
    compiler.hooks.compile.tap("SwiftWebpackPlugin", compilation => {
      this._compile();
    });
  }

  _compile() {
    log(`Compiling '${this.target}'`)
    try {
      fs.mkdirSync(this.dist);
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw e;
      }
    }

    const options = {
      cwd: this.packageDirectory,
    }
    runProcess(
      "swift",
      [
        "build", "--triple", "wasm32-unknown-wasi", "--build-path",
        this.buildDirectory,
      ],
      options
    ).then(() => {
      return runProcess(
        "cp",
        [
          path.join(this.buildDirectory, 'debug', this.target),
          path.join(this.dist, this.target + ".wasm"),
        ]
      );
    }).then(() => {
      log(`'${this.target}' has been compiled successfully`)
    }).catch((error) => log(error))
  }
}

module.exports = SwiftWebpackPlugin
