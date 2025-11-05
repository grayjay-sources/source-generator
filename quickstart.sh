#!/bin/bash

###############################################################################
# GrayJay Source Generator - Quick Start Script
# 
# This script demonstrates all the steps to build, install, and use the
# GrayJay Source Generator.
#
# Usage:
#   chmod +x quickstart.sh
#   ./quickstart.sh
#
# Note: This is a demonstration script. Each command is documented.
# You can run these commands manually if you prefer.
###############################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     GrayJay Source Generator - Quick Start Guide              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Build the generator
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STEP 1: Building the Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What: Compile TypeScript source to JavaScript"
echo "Why:  The generator is written in TypeScript for type safety"
echo "How:  npm run build (runs 'tsc' command)"
echo ""
read -p "Press Enter to continue..."

cd source-generator
npm run build

echo ""
echo "✅ Generator built successfully!"
echo ""

# Step 2: Install locally
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 STEP 2: Installing Generator Locally"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What: Create global symlink to local package"
echo "Why:  Makes 'grayjay-generate' command available system-wide"
echo "How:  npm link"
echo ""
read -p "Press Enter to continue..."

npm link

echo ""
echo "✅ Generator installed! Command 'grayjay-generate' is now available"
echo ""

# Step 3: Verify installation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ STEP 3: Verifying Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What: Check that command is properly installed"
echo "Why:  Ensure everything works before generating"
echo "How:  grayjay-generate --help"
echo ""
read -p "Press Enter to continue..."

grayjay-generate --help

echo ""
echo "✅ Verification complete!"
echo ""

# Step 4: Generate example plugin
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 STEP 4: Generating Example Plugin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What: Create a complete plugin skeleton"
echo "Why:  Provides a working starting point for your platform"
echo "How:  grayjay-generate with command-line arguments"
echo ""
echo "Features enabled:"
echo "  ✓ REST API support (--uses-api)"
echo "  ✓ HTML parsing (--uses-html)"
echo "  ✓ Authentication (--uses-auth)"
echo "  ✓ Search (--uses-search)"
echo "  ✓ Comments (--uses-comments)"
echo "  ✓ Playlists (--uses-playlists)"
echo ""
read -p "Press Enter to generate..."

cd ..

grayjay-generate \
  --name "DemoTube" \
  --platform-url "https://demotube.example.com" \
  --description "A demonstration video platform plugin for GrayJay" \
  --author "Your Name" \
  --author-url "https://github.com/yourusername" \
  --repository-url "https://github.com/yourusername/grayjay-demotube" \
  --base-url "https://api.demotube.example.com/v1" \
  --uses-api \
  --uses-html \
  --uses-auth \
  --uses-search \
  --uses-comments \
  --uses-playlists \
  --tags "video,streaming,demo" \
  --output "./demo-plugin"

echo ""
echo "✅ Plugin generated successfully!"
echo ""

# Step 5: Explore the generated structure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 STEP 5: Exploring Generated Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "What: View the generated files and directories"
echo "Why:  Understand where to make changes"
echo ""
read -p "Press Enter to continue..."

cd demo-plugin
echo ""
echo "Directory structure:"
tree -L 2 -I 'node_modules|dist' || ls -la

echo ""
echo "Key files:"
echo "  📄 src/script.ts        - Main plugin logic (edit this!)"
echo "  📄 config.json          - Plugin configuration"
echo "  📄 package.json         - npm package definition"
echo "  📄 dist/config.json     - Built configuration (auto-generated)"
echo "  📄 dist/script.js       - Built script (auto-generated)"
echo "  📁 scripts/             - Automation scripts"
echo "  📁 types/               - TypeScript type definitions"
echo ""

# Step 6: Show next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STEP 6: Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your plugin is ready for development!"
echo ""
echo "Common commands:"
echo "  npm run build       - Build the plugin"
echo "  npm run dev         - Watch mode (auto-rebuild on changes)"
echo "  npm run sign        - Sign the plugin (requires OpenSSL)"
echo "  npm run publish     - Publish new version to GitHub"
echo "  npm run submit      - Submit to official repository"
echo ""
echo "Development workflow:"
echo "  1. Edit src/script.ts to implement your platform"
echo "  2. Run 'npm run build' to compile"
echo "  3. Test in GrayJay app (load dist/config.json)"
echo "  4. Run 'npm run publish' when ready to release"
echo "  5. Run 'npm run submit' to contribute to official repo"
echo ""
echo "Documentation:"
echo "  📖 README.md in plugin directory"
echo "  📖 source-generator/WALKTHROUGH.md (comprehensive guide)"
echo "  📖 https://github.com/futo-org/grayjay (GrayJay docs)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Quick Start Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Happy coding! 🎉"
echo ""
