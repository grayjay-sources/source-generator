# @grayjay-sources/source-generator

Generate GrayJay source plugin projects with TypeScript/JavaScript, integrated testing, and automatic signing.

## Quick Start

```bash
# Run interactively (recommended)
npx @grayjay-sources/source-generator

# Or with options
npx @grayjay-sources/source-generator \
  --name "YouTube" \
  --platform-url "https://youtube.com" \
  --repository-url "https://github.com/user/grayjay-youtube" \
  --base-url "https://www.googleapis.com/youtube/v3" \
  --uses-api --uses-search
```

## Workflow

```bash
cd my-platform && npm install
npm run build          # Build plugin
npm test               # Unit tests (Node.js test runner)
npm run test:integration  # Test on Android device
npm run sign           # RSA sign (auto-generates keys)
npm run publish        # Build, sign, publish to GitHub
npm run submit         # Submit to grayjay-sources.github.io
```

## Testing

**Unit Tests** (`npm test`): Fast isolated tests using Node.js test runner + GrayJay polyfill

**Integration Tests** (`npm run test:integration`): Test on real Android device via Dev Portal (requires Dev Portal enabled in GrayJay app, same network)

## Generated Structure

```
my-platform/
├── src/
│   ├── script.ts         # Main plugin
│   ├── types.ts          # Custom platform types
│   ├── constants.ts      # Platform constants
│   ├── utils.ts          # Helper functions
│   ├── api.ts            # API client wrapper
│   └── utils/
│       ├── network.ts    # Unified network utilities
│       └── graphql.ts    # GraphQL utilities (if --uses-graphql)
├── test/
│   └── script.test.ts    # Unit tests
├── scripts/              # Build, sign, publish, test scripts
├── dist/                 # Build output (config.json, script.js)
└── config.json           # Plugin configuration
```

## Features

- **Unified Network System**: `fetch()`, `fetchJson()`, `fetchHtml()`, `fetchGraphQL()` with automatic retries
- **Node.js Test Runner**: Unit tests with `@kaidelorenzo/grayjay-polyfill`
- **Dev Portal Integration**: Test on Android via `@grayjay-sources/dev-portal-client`
- **Auto Signing**: RSA-2048 + SHA512 (requires OpenSSL)
- **Type Definitions**: Uses `@types/grayjay-source` from npm
- **Modular Structure**: Network utilities, API client, mappers, pagers, state management
- **Auto QR Code**: For easy plugin installation

## Requirements

- Node.js >= 14, npm >= 6.14.4
- OpenSSL (for signing)
- GrayJay Dev Portal (for integration tests)

## Links

- [GrayJay](https://grayjay.app/)
- [Plugin Docs](https://github.com/futo-org/grayjay)
- [GitHub](https://github.com/grayjay-sources/source-generator)
