#!/usr/bin/env node

/**
 * Utility functions for plugin automation scripts
 * Provides cross-platform support for common operations
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

/**
 * Colored console logging
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute a command and return output
 */
function execCommand(command, options = {}) {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "pipe", ...options });
  } catch (error) {
    throw new Error(
      `Command failed: ${command}\n${error.stderr || error.message}`
    );
  }
}

/**
 * Execute a command and inherit stdio (show output)
 */
function execCommandInherit(command) {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "inherit" });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    const checkCmd =
      os.platform() === "win32" ? `where ${command}` : `which ${command}`;
    execCommand(checkCmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
function getCommandVersion(command) {
  try {
    return execCommand(`${command} --version`).trim().split("\n")[0];
  } catch {
    return null;
  }
}

/**
 * Check if a dependency is installed
 */
function checkDependency(command, name, minVersion = null) {
  if (!commandExists(command)) {
    return { installed: false, name, command };
  }

  const version = getCommandVersion(command);
  return { installed: true, name, command, version };
}

/**
 * Get installation instructions for a tool
 */
function getInstallInstructions(tool) {
  const platform = os.platform();

  const instructions = {
    git: {
      win32: "winget install Git.Git",
      darwin: "brew install git",
      linux: "sudo apt install git",
    },
    gh: {
      win32: "winget install GitHub.cli",
      darwin: "brew install gh",
      linux: "sudo apt install gh",
    },
    node: {
      win32:
        "Download from https://nodejs.org/ or use: winget install OpenJS.NodeJS",
      darwin: "brew install node",
      linux: "sudo apt install nodejs npm",
    },
    openssl: {
      win32:
        "Included with Git for Windows, or download from https://slproweb.com/products/Win32OpenSSL.html",
      darwin: "brew install openssl",
      linux: "sudo apt install openssl",
    },
  };

  return instructions[tool]?.[platform] || `Install ${tool} for your platform`;
}

/**
 * Check all required dependencies
 */
function checkAllDependencies(required = ["git", "node", "npm"]) {
  log("\n🔍 Checking dependencies...", colors.cyan);

  const results = required.map((tool) => {
    const cmd = tool === "npm" || tool === "npx" ? tool : tool;
    const result = checkDependency(cmd, tool);

    if (result.installed) {
      log(`  ✅ ${result.name}: ${result.version}`, colors.green);
    } else {
      log(`  ❌ ${result.name} not found`, colors.red);
      log(`     Install: ${getInstallInstructions(tool)}`, colors.yellow);
    }

    return result;
  });

  const allInstalled = results.every((r) => r.installed);

  if (!allInstalled) {
    log(
      "\n❌ Some dependencies are missing. Please install them and try again.",
      colors.red
    );
    return false;
  }

  log("\n✅ All dependencies installed", colors.green);
  return true;
}

/**
 * Check Node.js version meets minimum requirement
 */
function checkNodeVersion(minVersion = 14) {
  const version = process.version.replace("v", "");
  const major = parseInt(version.split(".")[0]);

  if (major < minVersion) {
    log(
      `⚠️  Node.js version ${version} is below recommended ${minVersion}.x`,
      colors.yellow
    );
    log(
      `   Consider upgrading: ${getInstallInstructions("node")}`,
      colors.yellow
    );
    return false;
  }

  return true;
}

/**
 * Check if npm packages are up to date
 */
function checkNpmOutdated() {
  log("\n🔍 Checking for outdated packages...", colors.cyan);

  try {
    const outdated = execCommand("npm outdated --json");
    const packages = JSON.parse(outdated || "{}");

    if (Object.keys(packages).length > 0) {
      log(
        `⚠️  ${Object.keys(packages).length} package(s) are outdated`,
        colors.yellow
      );
      log("   Run: npm update", colors.yellow);
      return false;
    } else {
      log("✅ All packages are up to date", colors.green);
      return true;
    }
  } catch {
    // npm outdated returns exit code 1 if packages are outdated
    log("⚠️  Some packages may be outdated", colors.yellow);
    log("   Run: npm outdated", colors.yellow);
    return false;
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Read JSON file safely
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Write JSON file with formatting
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Get git username
 */
function getGitUsername() {
  try {
    return execCommand("git config user.name").trim();
  } catch {
    return null;
  }
}

/**
 * Get git email
 */
function getGitEmail() {
  try {
    return execCommand("git config user.email").trim();
  } catch {
    return null;
  }
}

/**
 * Check if git is configured
 */
function checkGitConfig() {
  const username = getGitUsername();
  const email = getGitEmail();

  if (!username || !email) {
    log("\n⚠️  Git is not configured", colors.yellow);
    log("   Configure with:", colors.yellow);
    log('   git config --global user.name "Your Name"', colors.reset);
    log(
      '   git config --global user.email "your.email@example.com"',
      colors.reset
    );
    return false;
  }

  return true;
}

/**
 * Get GitHub username from gh CLI
 */
function getGitHubUsername() {
  try {
    return execCommand("gh api user -q .login").trim();
  } catch {
    return null;
  }
}

/**
 * Check if authenticated with GitHub CLI
 */
function checkGitHubAuth() {
  try {
    execCommand("gh auth status");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current version from dist/config.json
 */
function getCurrentVersion() {
  const configPath = path.join(process.cwd(), "dist", "config.json");

  try {
    if (!fs.existsSync(configPath)) {
      log("⚠️  config.json not found. Building first...", colors.yellow);
      execCommandInherit("npm run build");
    }

    const config = readJsonFile(configPath);
    return config.version || 1;
  } catch (error) {
    log("⚠️  Could not read current version from config.json", colors.yellow);
    return 1;
  }
}

/**
 * Get GitHub repository info from package.json or git remote
 */
function getGitHubInfo() {
  try {
    const packageJson = readJsonFile(path.join(process.cwd(), "package.json"));
    const repoUrl =
      packageJson.repository?.url ||
      execCommand("git remote get-url origin").trim();

    // Parse GitHub owner and repo from URL
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);

    if (!match) {
      throw new Error("Could not parse GitHub repository from git remote");
    }

    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ""),
    };
  } catch (error) {
    throw new Error(`Failed to get GitHub info: ${error.message}`);
  }
}

/**
 * Generate QR code for plugin installation
 */
function generateQRCode(url, outputPath = null) {
  log("\n📱 Generating QR code...", colors.cyan);

  const qrPath = outputPath || path.join(process.cwd(), "assets", "qrcode.png");

  try {
    const QRCode = require("qrcode");

    // Ensure directory exists
    const dir = path.dirname(qrPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    QRCode.toFileSync(qrPath, url, {
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    log(`✅ QR code generated: ${qrPath}`, colors.green);
    return qrPath;
  } catch (error) {
    log(`⚠️  Failed to generate QR code: ${error.message}`, colors.yellow);
    return null;
  }
}

/**
 * Check if OpenSSL is available
 */
function checkOpenSSL() {
  if (!commandExists("openssl")) {
    log("❌ OpenSSL not found in PATH", colors.red);

    if (os.platform() === "win32") {
      log(
        "\n   💡 On Windows, OpenSSL is included with Git for Windows",
        colors.cyan
      );
      log(
        "   Git location: C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
        colors.reset
      );

      log("\n   🔧 Quick fix for PowerShell users:", colors.yellow);
      log(
        "      Import-Module $env:ChocolateyInstall\\helpers\\chocolateyProfile.psm1",
        colors.reset
      );
      log("      refreshenv", colors.reset);
      log("      # Then try npm run sign again", colors.reset);

      log("\n   Or add to PATH permanently:", colors.yellow);
      log(
        '      setx PATH "%PATH%;C:\\Program Files\\Git\\usr\\bin"',
        colors.reset
      );
    }

    log(`\n   Install: ${getInstallInstructions("openssl")}`, colors.yellow);
    return false;
  }

  const version = getCommandVersion("openssl");
  log(`✅ OpenSSL available: ${version}`, colors.green);
  return true;
}

/**
 * Parse command-line argument (supports both --arg=value and --arg value)
 */
function getArgValue(argName, defaultValue = null) {
  const args = process.argv;

  // Try --arg=value format first
  const equalArg = args.find((arg) => arg.startsWith(`--${argName}=`));
  if (equalArg) {
    return equalArg.split("=")[1];
  }

  // Try --arg value format
  const argIndex = args.indexOf(`--${argName}`);
  if (argIndex !== -1 && argIndex + 1 < args.length) {
    return args[argIndex + 1];
  }

  return defaultValue;
}

/**
 * Check if a host has an HTTP server running
 */
function checkHttpEndpoint(host, port, path = "/", timeout = 1000) {
  const http = require("http");

  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = http.get(
      `http://${host}:${port}${path}`,
      { timeout },
      (res) => {
        const responseTime = Date.now() - startTime;
        req.destroy();

        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            host,
            port,
            path,
            responseTime,
            available: true,
            statusCode: res.statusCode,
          });
        } else {
          resolve({
            host,
            port,
            path,
            available: false,
            statusCode: res.statusCode,
          });
        }
      }
    );

    req.on("error", () => {
      resolve({ host, port, path, available: false });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ host, port, path, available: false });
    });
  });
}

/**
 * Get local network IP addresses
 */
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  return ips;
}

/**
 * Open URL in default browser
 */
function openBrowser(url) {
  const { exec } = require("child_process");
  const platform = os.platform();

  const command = {
    darwin: `open "${url}"`,
    win32: `start "" "${url}"`,
    linux: `xdg-open "${url}"`,
  }[platform];

  if (command) {
    exec(command, (err) => {
      if (err) {
        log(
          `⚠️  Could not open browser automatically: ${err.message}`,
          colors.yellow
        );
        log(`   Please open manually: ${url}`, colors.yellow);
        return false;
      } else {
        log(`🌐 Opened in browser: ${url}`, colors.green);
        return true;
      }
    });
  } else {
    log(`   Please open in browser: ${url}`, colors.yellow);
    return false;
  }
}

/**
 * Check if an npm package is installed (in node_modules)
 */
function checkNpmPackage(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure an npm package is installed, install if missing
 */
function ensureNpmPackage(packageName, isDev = true) {
  if (checkNpmPackage(packageName)) {
    return true;
  }

  log(`📦 Package '${packageName}' not found. Installing...`, colors.yellow);

  try {
    const devFlag = isDev ? "--save-dev" : "--save";
    execCommandInherit(`npm install ${devFlag} ${packageName}`);
    log(`✅ Installed ${packageName}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Failed to install ${packageName}`, colors.red);
    log(
      `   Try manually: npm install ${
        isDev ? "--save-dev" : ""
      } ${packageName}`,
      colors.yellow
    );
    return false;
  }
}

module.exports = {
  colors,
  log,
  execCommand,
  execCommandInherit,
  commandExists,
  getCommandVersion,
  checkDependency,
  getInstallInstructions,
  checkAllDependencies,
  checkNodeVersion,
  checkNpmOutdated,
  ensureDir,
  readJsonFile,
  writeJsonFile,
  getGitUsername,
  getGitEmail,
  checkGitConfig,
  getGitHubUsername,
  checkGitHubAuth,
  getCurrentVersion,
  getGitHubInfo,
  generateQRCode,
  checkOpenSSL,
  checkNpmPackage,
  ensureNpmPackage,
  getArgValue,
  checkHttpEndpoint,
  getLocalIPs,
  openBrowser,
};
