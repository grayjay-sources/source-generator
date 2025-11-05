#!/usr/bin/env node

/**
 * GrayJay Plugin Testing Script
 *
 * This script:
 * 1. Uses mDNS to discover GrayJay devices via sync service (_gsync._tcp.local)
 * 2. Falls back to network scan if mDNS unavailable
 * 3. Starts a local HTTP server to serve plugin files
 * 4. Injects the plugin config to the dev server (port 11337)
 * 5. Tests plugin methods using the dev-portal-client
 *
 * Usage:
 *   npm run test                                  # Auto-discover
 *   npm run test -- --dev-ip 192.168.1.100       # Manual IP
 *   npm run test -- --dev-ip 100.100.1.57 --dev-port 11337
 *   npm run test -- --port 3000                  # Custom local server port
 *   npm run test -- --skip-mdns                  # Skip mDNS, use network scan
 */

const {
  DevPortalClient,
  discoverDevices,
} = require("@grayjay-sources/dev-portal-client");
const utils = require("./utils");
const { log, colors, readJsonFile, getArgValue, openBrowser } = utils;
const http = require("http");
const fs = require("fs");
const path = require("path");

// Configuration
const DEV_SERVER_IP = getArgValue("dev-ip");
const DEV_SERVER_PORT = parseInt(getArgValue("dev-port")) || 11337;
const SYNC_SERVICE_PORT = 12315;
const SYNC_SERVICE_NAME = "_gsync._tcp.local";
const LOCAL_SERVER_PORT = parseInt(getArgValue("port")) || 3000;
const SKIP_MDNS = process.argv.includes("--skip-mdns");
const TIMEOUT_MS = 500; // Network scan timeout per host

// getLocalIPs is now imported from utils

/**
 * Discover GrayJay devices using mDNS (Multicast DNS)
 * GrayJay sync service broadcasts on _gsync._tcp.local (port 12315)
 * Dev server runs on the same IP at port 11337
 * Uses 'bonjour' package - pure JavaScript, no native compilation!
 */
async function discoverViaMDNS() {
  log("\n📡 Discovering GrayJay devices via mDNS...", colors.cyan);
  log(`   Service: ${SYNC_SERVICE_NAME}`, colors.reset);

  try {
    // Use bonjour (pure JavaScript, no compilation needed!)
    const Bonjour = require("bonjour");
    const bonjour = Bonjour();

    return new Promise((resolve) => {
      const devices = [];

      // Browse for _gsync._tcp services
      const browser = bonjour.find({ type: "gsync" }, (service) => {
        const addresses = service.addresses || [];
        const mainAddress = addresses[0] || service.referer?.address;

        if (mainAddress) {
          log(
            `   Found: ${service.name || "GrayJay"} at ${mainAddress}:${
              service.port
            }`,
            colors.green
          );

          devices.push({
            name: service.name,
            host: mainAddress,
            syncPort: service.port,
            devPort: DEV_SERVER_PORT,
            available: false, // Will be verified later
          });
        }
      });

      // Stop discovery after timeout
      setTimeout(() => {
        browser.stop();
        bonjour.destroy();

        if (devices.length > 0) {
          log(`   ✅ Found ${devices.length} device(s) via mDNS`, colors.green);
        } else {
          log(
            "   ⚠️  No GrayJay devices broadcasting sync service",
            colors.yellow
          );
        }

        resolve(devices);
      }, 3000); // 3 second discovery window
    });
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      log("   ⚠️  bonjour package not available", colors.yellow);
      log("   This should have been installed automatically...", colors.cyan);
      log("   Try: npm install --save-dev bonjour", colors.yellow);
      log("   Falling back to network scan...", colors.yellow);
    } else {
      log(`   ⚠️  mDNS discovery error: ${error.message}`, colors.yellow);
      log("   Falling back to network scan...", colors.yellow);
    }
    return [];
  }
}

/**
 * Generate IP range for local subnet
 */
function generateIPRange(localIP) {
  const parts = localIP.split(".");
  const subnet = parts.slice(0, 3).join(".");
  const hosts = [];

  // Scan common subnet range (skip .0 and .255)
  for (let i = 1; i < 255; i++) {
    hosts.push(`${subnet}.${i}`);
  }

  return hosts;
}

/**
 * Check if a host has GrayJay dev server running
 * Wrapper around checkHttpEndpoint for dev server specific checks
 */
function checkHost(host, port, timeout = TIMEOUT_MS) {
  return checkHttpEndpoint(host, port, "/dev", timeout);
}

/**
 * Scan network for GrayJay dev servers (fallback method)
 */
async function scanNetwork() {
  log("\n🔍 Scanning local network for GrayJay dev servers...", colors.cyan);

  const localIPs = getLocalIPs();

  if (localIPs.length === 0) {
    log("❌ No network interfaces found", colors.red);
    return [];
  }

  log(`   Local IPs: ${localIPs.join(", ")}`, colors.reset);

  // Check common dev server IPs first
  const priorityHosts = [
    "localhost",
    "127.0.0.1",
    "100.100.1.57", // Common GrayJay dev server IP
    ...localIPs,
  ];

  log(`\n   Checking priority hosts...`, colors.yellow);
  const priorityResults = await Promise.all(
    priorityHosts.map((host) => checkHost(host, DEV_SERVER_PORT, 1000))
  );

  const foundServers = priorityResults.filter((r) => r.available);

  if (foundServers.length > 0) {
    log(`\n✅ Found ${foundServers.length} dev server(s):`, colors.green);
    foundServers.forEach((server) => {
      log(
        `   • http://${server.host}:${server.port} (${server.responseTime}ms)`,
        colors.green
      );
    });
    return foundServers;
  }

  // If no priority servers found, scan the subnet
  log(`\n   Priority hosts not found, scanning subnet...`, colors.yellow);
  log(`   This may take 30-60 seconds...`, colors.yellow);

  const allHosts = generateIPRange(localIPs[0]);
  const chunks = [];
  const chunkSize = 25; // Scan 25 hosts at a time

  for (let i = 0; i < allHosts.length; i += chunkSize) {
    chunks.push(allHosts.slice(i, i + chunkSize));
  }

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(
      `\r   Progress: ${Math.round((i / chunks.length) * 100)}%`
    );

    const results = await Promise.all(
      chunks[i].map((host) => checkHost(host, DEV_SERVER_PORT))
    );

    const found = results.filter((r) => r.available);
    found.forEach((server) => foundServers.push(server));
  }

  process.stdout.write("\r   Progress: 100%\n");

  if (foundServers.length > 0) {
    log(`\n✅ Found ${foundServers.length} dev server(s):`, colors.green);
    foundServers.forEach((server) => {
      log(`   • http://${server.host}:${server.port}`, colors.green);
    });
  } else {
    log(`\n⚠️  No GrayJay dev servers found on the network`, colors.yellow);
    log(
      `   Make sure the GrayJay app is open with dev mode enabled`,
      colors.yellow
    );
  }

  return foundServers;
}

/**
 * Start local HTTP server to serve plugin files
 */
function startLocalServer(port) {
  return new Promise((resolve, reject) => {
    const distPath = path.join(process.cwd(), "dist");

    if (!fs.existsSync(distPath)) {
      reject(
        new Error('dist/ directory not found. Run "npm run build" first.')
      );
      return;
    }

    const server = http.createServer((req, res) => {
      let filePath = path.join(
        distPath,
        req.url === "/" ? "config.json" : req.url
      );

      // Security: prevent directory traversal
      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        const ext = path.extname(filePath);
        const contentType =
          {
            ".json": "application/json",
            ".js": "application/javascript",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".html": "text/html",
          }[ext] || "text/plain";

        res.writeHead(200, {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      });
    });

    server.listen(port, () => {
      resolve(server);
    });

    server.on("error", reject);
  });
}

/**
 * Inject plugin to dev server
 */
async function injectPlugin(devServerHost, localServerHost, config) {
  const scriptUrl = `http://${localServerHost}:${LOCAL_SERVER_PORT}/script.js`;
  const configUrl = `http://${localServerHost}:${LOCAL_SERVER_PORT}/config.json`;

  log(`\n📤 Injecting plugin to dev server...`, colors.cyan);
  log(
    `   Dev Server: http://${devServerHost}:${DEV_SERVER_PORT}`,
    colors.reset
  );
  log(`   Script URL: ${scriptUrl}`, colors.reset);
  log(`   Config URL: ${configUrl}`, colors.reset);

  const payload = {
    url: scriptUrl,
    config: config,
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);

    const options = {
      hostname: devServerHost,
      port: DEV_SERVER_PORT,
      path: "/plugin/updateTestPlugin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          log(`\n✅ Plugin injected successfully!`, colors.green);
          log(
            `   Response: ${responseData || "No content (success)"}`,
            colors.reset
          );
          resolve(responseData);
        } else {
          log(
            `\n❌ Failed to inject plugin (HTTP ${res.statusCode})`,
            colors.red
          );
          log(`   Response: ${responseData}`, colors.red);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on("error", (err) => {
      log(`\n❌ Failed to inject plugin: ${err.message}`, colors.red);
      log(
        `   This might be normal if the dev server closed the connection`,
        colors.yellow
      );
      log(
        `   Check the dev portal manually at http://${devServerHost}:${DEV_SERVER_PORT}/dev`,
        colors.cyan
      );

      // Don't reject - the plugin might have been loaded despite the error
      resolve("Connection closed (may be successful)");
    });

    req.on("timeout", () => {
      log(`\n⏱️  Request timeout`, colors.yellow);
      req.destroy();
      resolve("Timeout (dev server may be processing)");
    });

    req.write(data);
    req.end();
  });
}

/**
 * Pre-load the dev portal and open in browser to ensure JS initializes
 */
async function preloadDevPortal(devServerHost) {
  log(`\n🌐 Loading dev portal...`, colors.cyan);

  const devPortalUrl = `http://${devServerHost}:${DEV_SERVER_PORT}/dev`;

  // Open browser immediately so JS can start initializing
  log(`   🚀 Opening browser to start JS initialization...`, colors.cyan);
  openBrowser(devPortalUrl);

  return new Promise((resolve) => {
    const req = http.get(devPortalUrl, { timeout: 10000 }, (res) => {
      req.destroy();
      if (res.statusCode === 200) {
        log(`   ✅ Dev portal responded`, colors.green);
        log(
          `   ⏳ Waiting 10 seconds for JavaScript to initialize...`,
          colors.yellow
        );

        setTimeout(() => {
          log(`   ✅ Portal should be ready now`, colors.green);
          resolve(true);
        }, 10000);
      } else {
        log(`   ⚠️  Dev portal returned ${res.statusCode}`, colors.yellow);
        resolve(false);
      }
    });

    req.on("error", () => {
      log(`   ⚠️  Could not pre-load dev portal`, colors.yellow);
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      log(`   ⚠️  Dev portal load timeout`, colors.yellow);
      resolve(false);
    });
  });
}

/**
 * Test plugin method via remote call
 */
async function testPluginMethod(devServerHost, pluginId, method, args = {}) {
  log(`\n🧪 Testing: ${method}()`, colors.cyan);

  const data = JSON.stringify({ args: Array.isArray(args) ? args : [] });

  const options = {
    hostname: devServerHost,
    port: DEV_SERVER_PORT,
    path: `/plugin/remoteCall?id=${pluginId}&method=${method}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          log(`   ✅ ${method}() executed successfully`, colors.green);

          try {
            const result = JSON.parse(responseData);
            log(
              `   Result: ${JSON.stringify(result).substring(0, 100)}...`,
              colors.reset
            );
            resolve({ success: true, result });
          } catch {
            log(`   Response: ${responseData.substring(0, 200)}`, colors.reset);
            resolve({ success: true, result: responseData });
          }
        } else {
          log(`   ❌ ${method}() failed (HTTP ${res.statusCode})`, colors.red);
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on("error", (err) => {
      log(`   ⚠️  ${method}() error: ${err.message}`, colors.yellow);
      resolve({ success: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
}

// openBrowser is now imported from utils

/**
 * Main test function
 */
async function main() {
  log(
    "\n╔════════════════════════════════════════════════════════════════╗",
    colors.cyan
  );
  log(
    "║     GrayJay Plugin Testing Tool                               ║",
    colors.cyan
  );
  log(
    "╚════════════════════════════════════════════════════════════════╝\n",
    colors.cyan
  );

  try {
    // Step 1: Discover devices using the dev-portal-client
    let devServerHost;

    if (DEV_SERVER_IP) {
      log(
        `\n🎯 Using manually specified IP: ${DEV_SERVER_IP}:${DEV_SERVER_PORT}`,
        colors.cyan
      );
      devServerHost = DEV_SERVER_IP;
    } else {
      log("\n📡 Discovering GrayJay devices...", colors.cyan);
      const devices = await discoverDevices(SKIP_MDNS);

      if (devices.length === 0) {
        log("\n❌ No dev servers found. Exiting.", colors.red);
        log("\n💡 Make sure:", colors.cyan);
        log("   • GrayJay app is running", colors.reset);
        log("   • Dev mode is enabled in GrayJay settings", colors.reset);
        log("   • Your device is on the same network", colors.reset);
        process.exit(1);
      }

      devServerHost = devices[0].host;
      log(`\n✅ Found device at ${devServerHost}`, colors.green);
    }

    // Step 2: Initialize dev portal client
    const client = new DevPortalClient(devServerHost, DEV_SERVER_PORT);

    // Step 3: Read config.json
    const configPath = path.join(process.cwd(), "dist", "config.json");

    if (!fs.existsSync(configPath)) {
      log("\n❌ Config file not found: dist/config.json", colors.red);
      log('   Run "npm run build" first', colors.yellow);
      process.exit(1);
    }

    const config = readJsonFile(configPath);
    log(`\n📦 Plugin: ${config.name} v${config.version}`, colors.cyan);

    // Step 4: Start local server
    log(
      `\n🌐 Starting local HTTP server on port ${LOCAL_SERVER_PORT}...`,
      colors.cyan
    );
    const server = await startLocalServer(LOCAL_SERVER_PORT);

    const localIPs = require("./utils").getLocalIPs();
    const localIP = localIPs[0] || "localhost";
    log(
      `   ✅ Server running at http://${localIP}:${LOCAL_SERVER_PORT}`,
      colors.green
    );

    // Step 5: Load portal and inject plugin
    log(`\n🔧 Loading dev portal and injecting plugin...`, colors.cyan);
    const scriptUrl = `http://${localIP}:${LOCAL_SERVER_PORT}/script.js`;

    await client.loadPortal(10000);
    await client.updateTestPlugin(scriptUrl, config);

    log(`   ✅ Plugin injected`, colors.green);

    // Step 6: Test plugin methods
    log(`\n🧪 Testing Plugin Methods`, colors.cyan);
    log(
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      colors.reset
    );

    // Test enable
    log(`\n   Testing enable()...`, colors.yellow);
    const enableResult = await client.testMethod("enable");
    log(
      `   • enable(): ${enableResult.success ? "✅" : "❌"}`,
      enableResult.success ? colors.green : colors.red
    );

    // Test getHome
    log(`\n   Testing getHome()...`, colors.yellow);
    const homeResult = await client.testMethod("getHome");
    log(
      `   • getHome(): ${homeResult.success ? "✅" : "❌"}`,
      homeResult.success ? colors.green : colors.red
    );

    if (homeResult.success && homeResult.result) {
      const videos = Array.isArray(homeResult.result)
        ? homeResult.result
        : homeResult.result.results || [];
      log(`      Videos: ${videos.length}`, colors.reset);
    }

    // Open browser to dev portal
    log(`\n🌐 Opening dev portal in browser...`, colors.cyan);
    const devPortalUrl = `http://${devServerHost}:${DEV_SERVER_PORT}/dev`;
    openBrowser(devPortalUrl);

    // Summary
    log(`\n✨ Testing environment ready!`, colors.green);
    log(`\n📝 Next steps:`, colors.cyan);
    log("   1. Use the dev portal to test other methods", colors.reset);
    log("   2. Make changes to your source code", colors.reset);
    log('   3. Run "npm run build" to rebuild', colors.reset);
    log('   4. Click "Reload" in the dev portal to test changes', colors.reset);
    log(`\n⚠️  Press Ctrl+C to stop the local server\n`, colors.yellow);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  log("\n\n👋 Shutting down...", colors.yellow);
  process.exit(0);
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
