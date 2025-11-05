#!/usr/bin/env node

/**
 * Automated Submission Script for grayjay-sources.github.io
 *
 * This script:
 * 1. Checks that git and gh CLI are installed
 * 2. Forks github.com/grayjay-sources/grayjay-sources.github.io (if not already forked)
 * 3. Clones the fork to a temporary directory
 * 4. Reads the generated plugin's config.json
 * 5. Adds/updates the entry in sources.json
 * 6. Commits and pushes changes to the fork
 * 7. Creates a pull request to the main repository
 *
 * Usage:
 *   npm run submit
 */

const utils = require("./utils");
const { execCommand, execCommandInherit, log, colors, readJsonFile } = utils;
const fs = require("fs");
const path = require("path");
const os = require("os");

const REPO_OWNER = "grayjay-sources";
const REPO_NAME = "grayjay-sources.github.io";
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

function checkDependencies() {
  const hasAll = utils.checkAllDependencies(["git", "gh"]);

  if (!hasAll) {
    process.exit(1);
  }
}

function checkGitHubAuth() {
  log("\n🔐 Checking GitHub authentication...", colors.cyan);

  if (!utils.checkGitHubAuth()) {
    log("❌ Not authenticated with GitHub", colors.red);
    log("   Run: gh auth login", colors.yellow);
    return false;
  }

  log("✅ Authenticated with GitHub", colors.green);
  return true;
}

function readPluginConfig() {
  log("\n📖 Reading plugin configuration...", colors.cyan);

  const configPath = path.join(__dirname, "..", "dist", "config.json");

  if (!fs.existsSync(configPath)) {
    log(
      "❌ dist/config.json not found. Build the plugin first with: npm run build",
      colors.red
    );
    process.exit(1);
  }

  try {
    const config = readJsonFile(configPath);
    log(`✅ Loaded config for: ${config.name}`, colors.green);
    return config;
  } catch (error) {
    log(`❌ Failed to parse config.json: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function getOrCreateFork() {
  log("\n🍴 Checking for fork...", colors.cyan);

  try {
    // Check if fork already exists
    const username = execCommand("gh api user -q .login").trim();

    try {
      execCommand(`gh repo view ${username}/${REPO_NAME}`, { stdio: "pipe" });
      log(`✅ Fork already exists: ${username}/${REPO_NAME}`, colors.green);
      return `${username}/${REPO_NAME}`;
    } catch {
      // Fork doesn't exist, create it
      log(`📝 Creating fork of ${REPO_OWNER}/${REPO_NAME}...`, colors.yellow);
      execCommand(`gh repo fork ${REPO_OWNER}/${REPO_NAME} --clone=false`);
      log(`✅ Fork created: ${username}/${REPO_NAME}`, colors.green);
      return `${username}/${REPO_NAME}`;
    }
  } catch (error) {
    log(`❌ Failed to create/find fork: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function cloneRepository(forkRepo) {
  log("\n📥 Cloning repository...", colors.cyan);

  const tempDir = path.join(os.tmpdir(), `grayjay-sources-${Date.now()}`);

  try {
    execCommand(`gh repo clone ${forkRepo} "${tempDir}"`, { stdio: "inherit" });
    log(`✅ Cloned to: ${tempDir}`, colors.green);
    return tempDir;
  } catch (error) {
    log(`❌ Failed to clone repository: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function updateSourcesJson(repoDir, pluginConfig) {
  log("\n📝 Updating sources.json...", colors.cyan);

  const sourcesPath = path.join(repoDir, "sources.json");

  if (!fs.existsSync(sourcesPath)) {
    log("❌ sources.json not found in cloned repository", colors.red);
    process.exit(1);
  }

  try {
    const sources = readJsonFile(sourcesPath);

    // Find existing entry by ID or name
    const existingIndex = sources.findIndex(
      (s) => s.id === pluginConfig.id || s.name === pluginConfig.name
    );

    // Prepare the entry to add
    const entry = {
      ...pluginConfig,
      // Add _installUrl for the repository
      _installUrl: pluginConfig.sourceUrl,
    };

    if (existingIndex >= 0) {
      log(
        `📝 Updating existing entry for: ${pluginConfig.name}`,
        colors.yellow
      );
      sources[existingIndex] = entry;
    } else {
      log(`➕ Adding new entry for: ${pluginConfig.name}`, colors.green);
      sources.push(entry);
    }

    // Write back to sources.json
    utils.writeJsonFile(sourcesPath, sources);
    log(`✅ sources.json updated successfully`, colors.green);

    return existingIndex >= 0 ? "update" : "add";
  } catch (error) {
    log(`❌ Failed to update sources.json: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function commitAndPush(repoDir, pluginName, action) {
  log("\n💾 Committing changes...", colors.cyan);

  const branchName = `add-${pluginName
    .toLowerCase()
    .replace(/\s+/g, "-")}-plugin`;

  try {
    // Configure git if needed
    process.chdir(repoDir);

    // Create and checkout new branch
    execCommand(`git checkout -b ${branchName}`);
    log(`✅ Created branch: ${branchName}`, colors.green);

    // Stage changes
    execCommand("git add sources.json");

    // Commit
    const commitMessage =
      action === "update"
        ? `chore: Update ${pluginName} plugin\n\n- Updated plugin configuration\n- Version bump or metadata changes`
        : `feat: Add ${pluginName} plugin\n\n- Added new plugin for ${pluginName}\n- Includes all required configuration`;

    execCommand(`git commit -m "${commitMessage}"`);
    log("✅ Changes committed", colors.green);

    // Push to fork
    log("\n📤 Pushing to fork...", colors.yellow);
    execCommand(`git push -u origin ${branchName}`, { stdio: "inherit" });
    log("✅ Pushed to fork", colors.green);

    return branchName;
  } catch (error) {
    log(`❌ Failed to commit/push: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function createPullRequest(forkRepo, branchName, pluginName, action) {
  log("\n🔀 Creating pull request...", colors.cyan);

  const title =
    action === "update"
      ? `Update ${pluginName} plugin`
      : `Add ${pluginName} plugin`;

  const body =
    action === "update"
      ? `## Update ${pluginName} Plugin

This PR updates the configuration for the ${pluginName} plugin.

### Changes
- Updated plugin configuration
- Version bump or metadata changes

### Testing
- [ ] Plugin builds successfully
- [ ] Plugin loads in GrayJay app
- [ ] All methods work as expected

---
*This PR was automatically generated by @grayjay/source-generator*`
      : `## Add ${pluginName} Plugin

This PR adds a new plugin for ${pluginName}.

### Features
- Home feed support
- Search functionality
- Channel browsing
- Video playback

### Testing
- [ ] Plugin builds successfully
- [ ] Plugin loads in GrayJay app
- [ ] All methods work as expected

### Checklist
- [ ] Plugin follows GrayJay guidelines
- [ ] All required fields are present
- [ ] Icon and QR code included
- [ ] README documentation included

---
*This PR was automatically generated by @grayjay/source-generator*`;

  try {
    const prUrl = execCommand(
      `gh pr create --repo ${REPO_OWNER}/${REPO_NAME} --title "${title}" --body "${body}"`,
      { encoding: "utf-8" }
    ).trim();

    log(`✅ Pull request created: ${prUrl}`, colors.green);
    return prUrl;
  } catch (error) {
    log(`❌ Failed to create pull request: ${error.message}`, colors.red);
    log(`   You may need to create it manually at:`, colors.yellow);
    log(
      `   https://github.com/${forkRepo}/compare/${branchName}?expand=1`,
      colors.yellow
    );
    return null;
  }
}

function cleanup(tempDir) {
  log("\n🧹 Cleaning up...", colors.cyan);

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      log("✅ Temporary files cleaned up", colors.green);
    }
  } catch (error) {
    log(`⚠️  Could not clean up temp directory: ${tempDir}`, colors.yellow);
  }
}

async function submit() {
  log("\n🚀 GrayJay Plugin Submission Tool\n", colors.cyan);
  log(
    "This will submit your plugin to grayjay-sources.github.io\n",
    colors.blue
  );

  // Step 1: Check dependencies
  checkDependencies();

  // Step 2: Check GitHub auth
  if (!checkGitHubAuth()) {
    process.exit(1);
  }

  // Step 3: Read plugin config
  const pluginConfig = readPluginConfig();

  // Step 4: Get or create fork
  const forkRepo = getOrCreateFork();

  // Step 5: Clone repository
  const tempDir = cloneRepository(forkRepo);

  let prUrl = null;

  try {
    // Step 6: Update sources.json
    const action = updateSourcesJson(tempDir, pluginConfig);

    // Step 7: Commit and push
    const branchName = commitAndPush(tempDir, pluginConfig.name, action);

    // Step 8: Create pull request
    prUrl = createPullRequest(forkRepo, branchName, pluginConfig.name, action);
  } finally {
    // Step 9: Cleanup
    cleanup(tempDir);
  }

  // Summary
  log(`\n✅ Submission complete!\n`, colors.green);
  log(`📋 Summary:`, colors.cyan);
  log(`   Plugin: ${pluginConfig.name}`, colors.reset);
  log(`   Version: ${pluginConfig.version}`, colors.reset);
  log(`   Repository: ${pluginConfig.repositoryUrl}`, colors.reset);

  if (prUrl) {
    log(`\n🔗 Pull Request: ${prUrl}`, colors.blue);
    log(`\n📝 Next steps:`, colors.cyan);
    log(`   1. Wait for maintainers to review your PR`, colors.reset);
    log(`   2. Address any feedback if requested`, colors.reset);
    log(
      `   3. Once merged, your plugin will appear on grayjay-sources.github.io!`,
      colors.reset
    );
  } else {
    log(`\n⚠️  Create the PR manually:`, colors.yellow);
    log(`   Visit: https://github.com/${forkRepo}/compare`, colors.reset);
  }

  log(
    `\n🎉 Thank you for contributing to the GrayJay ecosystem!\n`,
    colors.green
  );
}

submit().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
