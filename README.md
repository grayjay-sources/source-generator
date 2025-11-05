# @grayjay-sources/source-generator

A powerful CLI tool to generate GrayJay source plugin skeleton projects with TypeScript or JavaScript.

## Features

- 🎯 Interactive CLI for easy setup
- 📦 Complete project scaffolding
- 🔧 TypeScript or JavaScript support
- 🔐 **RSA Plugin Signing** - Automatic key generation and signature creation
- 🖼️ Automatic icon and QR code generation
- 📝 Pre-configured build system with Rollup
- 🚀 Automated publishing workflow
- 🎨 Beautiful, modular project structure
- ⚡ Production-ready templates with best practices

## Installation

### Global Installation (Recommended)

```bash
npm install -g @grayjay-sources/source-generator
```

### Local Usage with npx

```bash
npx @grayjay-sources/source-generator
```

## Usage

### Interactive Mode (Recommended)

Simply run the command and follow the prompts:

```bash
grayjay-generate
```

Or use the short alias:

```bash
gjsg
```

### Command Line Arguments

```bash
grayjay-generate \
  --name "My Platform" \
  --platform-url "https://example.com" \
  --description "My platform description" \
  --author "Your Name" \
  --repository-url "https://github.com/username/repo" \
  --base-url "https://api.example.com" \
  --uses-api \
  --uses-graphql \
  --uses-auth \
  --uses-comments \
  --uses-playlists \
  --uses-search
```

### Options

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--name <name>` | `-n` | Platform name | Yes |
| `--platform-url <url>` | `-p` | Platform URL (e.g., https://example.com) | Yes |
| `--repository-url <url>` | `-r` | Repository URL | Yes |
| `--base-url <url>` | `-b` | Base API URL | Yes |
| `--description <text>` | `-d` | Platform description | No |
| `--author <name>` | `-a` | Author name | No |
| `--author-url <url>` | | Author URL | No |
| `--logo-url <url>` | | Logo URL (auto-resolves from favicon if omitted) | No |
| `--uses-api` | | Use REST API | No |
| `--uses-graphql` | | Use GraphQL API | No |
| `--uses-html` | | Use HTML parsing | No |
| `--uses-webscraping` | | Use web scraping | No |
| `--uses-auth` | | Enable authentication support | No |
| `--uses-live` | | Enable live streams support | No |
| `--uses-comments` | | Enable comments support | No |
| `--uses-playlists` | | Enable playlists support | No |
| `--uses-search` | | Enable search support | No |
| `--output <dir>` | `-o` | Output directory | No |
| `--interactive` | `-i` | Force interactive mode | No |
| `--js` | | Generate JavaScript instead of TypeScript | No |

## Examples

### Example 1: Complete Command Line

```bash
grayjay-generate \
  --name "Vimeo" \
  --platform-url "https://vimeo.com" \
  --description "Vimeo video platform" \
  --author "Bluscream" \
  --repository-url "https://github.com/grayjay-sources/vimeo" \
  --base-url "https://api.vimeo.com" \
  --uses-api \
  --uses-graphql \
  --uses-auth \
  --uses-comments \
  --uses-playlists
```

### Example 2: Minimal Command (Interactive Prompts for Rest)

```bash
grayjay-generate -i
```

### Example 3: JavaScript Project

```bash
grayjay-generate --js -i
```

## Generated Project Structure

```
my-platform/
├── src/
│   ├── script.ts              # Main plugin entry point
│   ├── constants.ts           # Platform constants
│   ├── utils.ts               # Utility functions
│   ├── api/                   # API client module (if using REST)
│   │   └── client.ts
│   ├── graphql/               # GraphQL queries (if using GraphQL)
│   │   └── queries.ts
│   ├── html/                  # HTML parsing (if using HTML)
│   │   └── parser.ts
│   ├── mappers/               # Data transformation
│   │   └── index.ts
│   ├── pagers/                # Pagination classes
│   │   └── index.ts
│   └── state/                 # State management (if using auth)
│       └── index.ts
├── dist/                      # Build output (gitignored)
│   ├── config.json            # Minified configuration
│   └── script.js              # Minified and compiled script
├── .secrets/                  # Private keys (gitignored)
│   └── signing_key.pem        # RSA private key for signing
├── assets/
│   ├── logo.png               # Auto-resolved platform logo
│   ├── logo.svg               # SVG version (if available)
│   └── qrcode.png             # QR code for installation
├── scripts/
│   ├── sign.js                # Plugin signing script
│   └── publish.js             # Automated publishing script
├── .github/
│   └── workflows/
│       └── release.yml        # Automated release workflow
├── config.json                # Plugin configuration
├── package.json
├── tsconfig.json
├── rollup.config.js
├── README.md
└── .gitignore
```

## Development Workflow

After generating your plugin:

1. **Install dependencies:**
   ```bash
   cd my-platform
   npm install
   ```

2. **Implement your plugin logic:**
   Edit `src/Script.ts` and add your API calls and data mapping

3. **Build the plugin:**
   ```bash
   npm run build
   ```

4. **Development mode (watch for changes):**
   ```bash
   npm run dev
   ```

5. **Sign the plugin:**
   ```bash
   npm run sign
   ```
   This automatically generates an RSA key (first time) and signs your plugin

6. **Build and sign in one command:**
   ```bash
   npm run build:sign
   ```

7. **Test in GrayJay:**
   - Open GrayJay app
   - Scan the QR code in `assets/qrcode.png`
   - Or manually import the plugin from the `dist/` folder

## 🔐 Plugin Signing

Generated plugins include automatic RSA signing for security:

### How It Works

1. **Automatic Key Generation**: On first `npm run sign`, a 2048-bit RSA private key is automatically generated in `.secrets/signing_key.pem`

2. **Signature Creation**: Creates a SHA512 signature of your `dist/script.js` file

3. **Public Key Extraction**: Extracts the public key from the private key for GrayJay verification

4. **Config Update**: Automatically updates `dist/config.json` with `scriptSignature` and `scriptPublicKey` fields

### Commands

```bash
# Sign the plugin (after building)
npm run sign

# Build and sign in one command
npm run build:sign

# Build, sign, and publish
npm run build:publish
```

### Security

- ✅ Private key stored in `.secrets/` (gitignored)
- ✅ Automatic key validation before use
- ✅ SHA512 signature for strong security
- ✅ Compatible with GrayJay's verification system

### Requirements

- **OpenSSL**: Required for signing
  - Linux/Mac: Usually pre-installed
  - Windows: Available via Git Bash or WSL

### Manual Signing

If you need to sign manually:

```bash
# Generate signature
openssl dgst -sha512 -sign .secrets/signing_key.pem dist/script.js | openssl base64 -A

# Extract public key
openssl rsa -pubout -outform DER -in .secrets/signing_key.pem | openssl pkey -pubin -inform DER -outform PEM
```

## Plugin Capabilities

The generator supports various platform capabilities:

- **REST API**: Standard HTTP REST API integration
- **GraphQL**: GraphQL query support with persisted queries
- **HTML Parsing**: DOM parsing for web scraping
- **Web Scraping**: Advanced web scraping capabilities
- **Authentication**: User login and session management
- **Live Streams**: Real-time video streaming
- **Comments**: User comments and discussions
- **Playlists**: Video playlists and collections
- **Search**: Content search functionality

## Programmatic Usage

You can also use the generator programmatically:

```typescript
import { SourceGenerator } from '@grayjay-sources/source-generator';

const generator = new SourceGenerator({
  outputDir: './my-plugin',
  config: {
    name: 'My Platform',
    platformUrl: 'https://example.com',
    description: 'My platform description',
    author: 'Your Name',
    repositoryUrl: 'https://github.com/username/repo',
    baseUrl: 'https://api.example.com',
    uses: ['api', 'graphql'],
    hasAuth: true,
    hasComments: true,
    hasPlaylists: true,
    hasSearch: true,
    version: 1
  },
  typescript: true
});

await generator.generate();
```

## Requirements

- **Node.js** >= 14
- **npm** >= 6.14.4
- **OpenSSL** (for plugin signing)
  - Linux/Mac: Usually pre-installed
  - Windows: Available via Git Bash, WSL, or [OpenSSL for Windows](https://slproweb.com/products/Win32OpenSSL.html)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Links

- [GrayJay](https://grayjay.app/)
- [GrayJay Plugin Documentation](https://github.com/futo-org/grayjay)
- [NPM Package](https://www.npmjs.com/package/@grayjay/source-generator)
- [GitHub Repository](https://github.com/grayjay-sources/source-generator)

## Support

For issues and questions:
- GitHub Issues: https://github.com/grayjay-sources/source-generator/issues
- GrayJay Discord: https://discord.gg/grayjay

## Acknowledgments

This generator is based on the official GrayJay plugin templates and the Dailymotion plugin structure.
