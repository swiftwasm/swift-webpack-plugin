const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Watchpack = require('watchpack');
const log = msg => console.log("[swift-webpack-plugin] ", msg);

function runProcess(bin, args, options) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, options);
    let errorMessage = "";
    let output = "";

    p.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        const cmd = [bin].concat(args).join(" ")
        reject(new Error(`Failed to execute: ${cmd}\n${errorMessage}\n${output}`));
      }
    });
    p.stderr.on('data', (data) => {
      errorMessage += data.toString();
    });
    p.stdout.on('data', (data) => {
      output += data.toString();
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
    this.building = false;
    this.ignoring = [this.buildDirectory, this.dist, ".git", "node_modules"]
    this.wp = new Watchpack({
      ignored: this.ignoring,
    });
  }
  apply(compiler) {
    compiler.hooks.watchRun.tap("SwiftWebpackPlugin", () => {
      log("Watching " + this.packageDirectory)
      this.wp.watch([], [this.packageDirectory], Date.now() - 10000);
      this.wp.on('change', (filePath, mtime, explanation) => {
	if (this.ignoring.some(i => filePath.includes(i)))
	  return;
        this._compile()
      })
    })
    compiler.hooks.compile.tap("SwiftWebpackPlugin", compilation => {
      this._compile();
    });
  }

  _compile() {
    if (this.building) return;
    this.building = true;
    log(`Compiling '${this.target}'`)
    try {
      fs.mkdirSync(this.dist);
      log(`Created dist directory '${this.dist}'`)
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw e;
      }
    }

    const options = {
      cwd: this.packageDirectory,
    }
    const buildArgs = [
      "build", "--triple", "wasm32-unknown-wasi", "--build-path",
      this.buildDirectory,
    ]
    runProcess("swift", buildArgs, options)
      .then(() => runProcess("swift", buildArgs.concat(["--show-bin-path"]), options))
      .then((binPath) => {
        return runProcess(
          "cp",
          [
            path.join(binPath.slice(0, binPath.length - 1), this.target),
            path.join(this.dist, this.target + ".wasm"),
          ]
        );
      })
      .then(() => {
	log(`'${this.target}' has been compiled successfully`)
	this.building = false;
      })
      .catch((error) => {
        log(error)
	this.building = false;
      })
  }
}

module.exports = SwiftWebpackPlugin
