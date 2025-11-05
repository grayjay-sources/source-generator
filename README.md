# @grayjay-sources/source-generator

CLI tool to generate GrayJay source plugin skeleton projects with TypeScript or JavaScript.

## Features

- 🎯 Interactive CLI for easy setup
- 🔧 TypeScript or JavaScript support
- 🔐 Automatic RSA plugin signing
- 🧪 Integrated dev portal testing
- 📦 Complete project scaffolding with build system
- 🖼️ Automatic icon and QR code generation

## Installation

```bash
# Global installation (recommended)
npm install -g @grayjay-sources/source-generator

# Or use with npx
npx @grayjay-sources/source-generator
```

## Usage

### Interactive Mode

```bash
grayjay-generate
# or
gjsg
```

### Command Line

```bash
grayjay-generate \
  --name "My Platform" \
  --platform-url "https://example.com" \
  --repository-url "https://github.com/user/repo" \
  --base-url "https://api.example.com" \
  --uses-api \
  --uses-auth \
  --uses-search
```

### Key Options

| Option                   | Description                               |
| ------------------------ | ----------------------------------------- |
| `--name <name>`          | Platform name (required)                  |
| `--platform-url <url>`   | Platform URL (required)                   |
| `--repository-url <url>` | Repository URL (required)                 |
| `--base-url <url>`       | Base API URL (required)                   |
| `--uses-api`             | Use REST API                              |
| `--uses-graphql`         | Use GraphQL API                           |
| `--uses-auth`            | Enable authentication                     |
| `--uses-comments`        | Enable comments                           |
| `--uses-playlists`       | Enable playlists                          |
| `--uses-search`          | Enable search                             |
| `--js`                   | Generate JavaScript instead of TypeScript |

## Generated Project

```
my-platform/
├── src/
│   ├── script.ts           # Main plugin entry
│   ├── api/client.ts       # API client
│   ├── mappers/            # Data transformation
│   └── state/              # State management
├── dist/                   # Build output
├── .secrets/               # Private keys (gitignored)
├── assets/                 # Logo, QR code
├── scripts/                # Sign, publish, test
├── config.json
├── package.json
└── rollup.config.js
```

## Development Workflow

```bash
cd my-platform
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Test with auto-discovery
npm run test

# Test with manual IP
npm run test -- --dev-ip 192.168.1.100

# Sign plugin
npm run sign

# Build and sign
npm run build:sign

# Publish plugin (includes build and sign)
npm run publish

# Submit to GrayJay registry (includes build and sign)
npm run submit
```

## Testing

The generated project includes automated testing via the GrayJay Dev Portal:

```bash
npm run test
```

This will:

- Auto-discover GrayJay devices on your network (mDNS)
- Start a local HTTP server for plugin files
- Automatically inject your plugin into the dev portal
- Run tests on `enable()`, `getHome()`, `search()`, etc.
- Show detailed pass/fail results

**Requirements:**

- Enable Dev Portal in GrayJay app (Settings → Developer)
- Same network for dev machine and GrayJay device
- Test script auto-selects optimal local IP for reachability

## Plugin Signing

Automatic RSA signing for security:

```bash
npm run sign
```

**What it does:**

1. Generates 2048-bit RSA key (first time only) in `.secrets/signing_key.pem`
2. Creates SHA512 signature of `dist/script.js`
3. Updates `dist/config.json` with signature and public key

**Security:**

- Private key in `.secrets/` (gitignored)
- SHA512 signature
- Compatible with GrayJay verification

**Requirements:**

- OpenSSL (pre-installed on Linux/Mac, Git Bash/WSL on Windows)

## Available Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run build`      | Build plugin                       |
| `npm run dev`        | Watch mode                         |
| `npm run test`       | Auto-test via dev portal           |
| `npm run sign`       | Sign plugin                        |
| `npm run build:sign` | Build and sign                     |
| `npm run publish`    | Build, sign, and publish to GitHub |
| `npm run submit`     | Build, sign, and submit to GrayJay |

## Plugin Capabilities

The generator supports:

- REST API / GraphQL
- HTML parsing / Web scraping
- Authentication
- Live streams
- Comments / Playlists
- Search

## Requirements

- Node.js >= 14
- npm >= 6.14.4
- OpenSSL (for signing)

## Programmatic Usage

```typescript
import { SourceGenerator } from "@grayjay-sources/source-generator";

const generator = new SourceGenerator({
  outputDir: "./my-plugin",
  config: {
    name: "My Platform",
    platformUrl: "https://example.com",
    repositoryUrl: "https://github.com/user/repo",
    baseUrl: "https://api.example.com",
    uses: ["api", "graphql"],
    hasAuth: true,
    version: 1,
  },
  typescript: true,
});

await generator.generate();
```

## License

MIT

## Links

- [GrayJay](https://grayjay.app/)
- [GrayJay Plugin Documentation](https://github.com/futo-org/grayjay)
- [NPM Package](https://www.npmjs.com/package/@grayjay-sources/source-generator)
- [GitHub Repository](https://github.com/grayjay-sources/source-generator)
