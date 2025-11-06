import { SourceConfig } from '../types';
import { PluginSetting } from '../types/sourceconfig';

function generateSimpleUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getGitHubUsername(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/([^\/]+)/);
  return match ? match[1] : 'username';
}

function getRepoName(repoUrl: string): string {
  const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)/);
  return match ? match[1].replace(/\.git$/, '') : 'repo';
}

export function generateConfigJson(config: SourceConfig): string {
  const packageNames: string[] = ['Http'];
  
  if (config.usesHtml) {
    packageNames.push('DOMParser');
  }

  // Parse base URL(s) - can be comma-separated, always an array
  const baseUrls = config.baseUrl.split(',').map(u => u.trim()).filter(u => u);

  // Build settings array
  const settings: PluginSetting[] = [];

  // Always create base URL setting (source of truth for available URLs)
  // For single URL: still a dropdown but with only 1 option (consistent API)
  // Add baseUrl dropdown setting (single or multiple options)
  settings.push({
    variable: 'baseUrl',
    name: 'API Server',
    description: baseUrls.length > 1
      ? 'Select which API server to use'
      : 'API server endpoint',
    type: 'Dropdown',
    default: baseUrls[0],
    options: baseUrls
  });

  // Add debug logging toggle
  settings.push({
    variable: 'enableDebugLogging',
    name: 'Enable Debug Logging',
    description: 'Enable detailed logging for debugging purposes',
    type: 'Boolean',
    default: 'false'
  });

  // Collect all hostnames for allowUrls with wildcard patterns
  const allowUrls: string[] = [];
  
  // Add platform URL
  const platformHostname = new URL(config.platformUrl).hostname;
  allowUrls.push(platformHostname);
  allowUrls.push('.' + platformHostname); // Wildcard for subdomains
  
  // Add all base URLs
  for (const url of baseUrls) {
    const hostname = new URL(url).hostname;
    if (!allowUrls.includes(hostname)) {
      allowUrls.push(hostname);
      allowUrls.push('.' + hostname); // Wildcard for subdomains
    }
  }

  const configObj = {
    name: config.name,
    platformUrl: config.platformUrl,
    description: config.description,
    author: config.author,
    authorUrl: config.authorUrl || '',
    sourceUrl: `${config.repositoryUrl}/releases/latest/download/config.json`,
    scriptUrl: './script.js',
    repositoryUrl: config.repositoryUrl,
    version: config.version || 1,
    iconUrl: config.logoUrl || 'https://grayjay.app/images/webclip.png',
    id: generateSimpleUUID(),
    scriptSignature: '',
    scriptPublicKey: '',
    packages: packageNames,
    allowEval: false,
    allowAllHttpHeaderAccess: false,
    allowUrls,
    ...(config.hasAuth && {
      authentication: {
        loginUrl: `${config.platformUrl}/login`,
        completionUrl: config.platformUrl,
        domainHeadersToFind: {
          [new URL(baseUrls[0]).hostname]: ['authorization', 'cookie']
        },
        userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36'
      }
    }),
    supportedClaimTypes: [27], // Video claim type
    settings,
    changelog: {
      '1': ['Initial release']
    },
    // Runtime constants (configurable without rebuilding)
    // Note: Available base URLs are in settings[baseUrl].options
    constants: {
      defaultHeaders: {}
    },
    // grayjay-sources.github.io specific options (prefixed with _)
    ...(config._tags && config._tags.length > 0 && { _tags: config._tags }),
    ...(config._nsfw && { _nsfw: config._nsfw }),
    ...(config._generatorUrl && { _generatorUrl: config._generatorUrl }),
    ...(config._feeds && { _feeds: config._feeds }),
    ...(config._customButtons && config._customButtons.length > 0 && { _customButtons: config._customButtons }),
  };

  return JSON.stringify(configObj, null, 2);
}
