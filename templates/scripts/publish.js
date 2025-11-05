#!/usr/bin/env node

/**
 * Automated Publishing Script for GrayJay Plugin
 * 
 * This script:
 * 1. Reads the current version from dist/config.json
 * 2. Bumps the version (patch by default, or specify version)
 * 3. Updates dist/config.json with the new version
 * 4. Builds the plugin
 * 5. Signs the plugin (generates signature and public key)
 * 6. Generates a QR code for the plugin
 * 7. Commits the changes
 * 8. Creates a git tag
 * 9. Pushes to GitHub (triggers release workflow)
 * 
 * Usage:
 *   npm run publish        # Bumps patch version
 *   npm run publish 2      # Sets version to 2
 */

const utils = require('./utils');
const { log, colors, execCommandInherit, readJsonFile, writeJsonFile, getCurrentVersion, getGitHubInfo, generateQRCode } = utils;
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'dist', 'config.json');

async function publish() {
  log('\n🚀 GrayJay Plugin Publisher\n', colors.cyan);
  
  // Step 1: Get version
  const currentVersion = getCurrentVersion();
  const newVersion = process.argv[2] ? parseInt(process.argv[2]) : currentVersion + 1;
  
  if (isNaN(newVersion) || newVersion < 1) {
    log('❌ Invalid version number. Must be a positive integer.', colors.red);
    process.exit(1);
  }
  
  log(`📦 Current version: ${currentVersion}`, colors.cyan);
  log(`📦 New version: ${newVersion}`, colors.cyan);
  
  // Step 2: Get GitHub info for install URL
  let githubInfo;
  try {
    githubInfo = getGitHubInfo();
    log(`✅ Repository: ${githubInfo.owner}/${githubInfo.repo}`, colors.green);
  } catch (error) {
    log(`❌ ${error.message}`, colors.red);
    process.exit(1);
  }
  
  // Step 3: Build the plugin
  log('\n🔨 Building plugin...', colors.yellow);
  execCommandInherit('npm run build');
  
  // Step 4: Update version in config.json
  log('\n📝 Updating version in config.json...', colors.cyan);
  const config = readJsonFile(CONFIG_PATH);
  const oldVersion = config.version || 1;
  config.version = newVersion;
  writeJsonFile(CONFIG_PATH, config);
  log(`📦 Version bumped: ${oldVersion} → ${newVersion}`, colors.cyan);
  
  // Step 5: Sign the plugin
  log('\n🔐 Signing plugin...', colors.yellow);
  try {
    execCommandInherit('npm run sign');
  } catch (error) {
    log('❌ Signing failed. Make sure OpenSSL is installed.', colors.red);
    process.exit(1);
  }
  
  // Reload config after signing to get signature
  const signedConfig = readJsonFile(CONFIG_PATH);
  
  // Step 6: Generate QR code
  const installUrl = `grayjay://plugin/${signedConfig.sourceUrl}`;
  generateQRCode(installUrl);
  
  // Step 7: Commit changes
  log('\n📝 Committing changes...', colors.cyan);
  execCommandInherit('git add dist/ assets/qrcode.png');
  execCommandInherit(`git commit -m "chore: Release v${newVersion}" -m "- Updated version to ${newVersion}" -m "- Signed plugin" -m "- Generated QR code"`);
  log('✅ Changes committed', colors.green);
  
  // Step 8: Create git tag
  log(`\n🏷️  Creating git tag v${newVersion}...`, colors.cyan);
  execCommandInherit(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  log(`✅ Tag created: v${newVersion}`, colors.green);
  
  // Step 9: Push to GitHub
  log('\n📤 Pushing to GitHub...', colors.yellow);
  execCommandInherit('git push && git push --tags');
  log('✅ Pushed successfully!', colors.green);
  
  log(`\n✅ Publication complete!\n`, colors.green);
  log(`📋 Summary:`, colors.cyan);
  log(`   Version: v${newVersion}`, colors.reset);
  log(`   Repository: ${githubInfo.owner}/${githubInfo.repo}`, colors.reset);
  log(`   Install URL: ${installUrl}`, colors.reset);
  log(`\n📦 GitHub Release will be created automatically`, colors.cyan);
  log(`   Check: https://github.com/${githubInfo.owner}/${githubInfo.repo}/releases/tag/v${newVersion}`, colors.reset);
}

publish().catch((error) => {
  log(`❌ Unexpected error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
