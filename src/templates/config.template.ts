import { SourceConfig } from '../types';

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
    allowUrls: [
      new URL(config.baseUrl).hostname,
      new URL(config.platformUrl).hostname,
    ].filter((v, i, a) => a.indexOf(v) === i), // unique values
    ...(config.hasAuth && {
      authentication: {
        loginUrl: `${config.platformUrl}/login`,
        completionUrl: config.platformUrl,
        domainHeadersToFind: {
          [new URL(config.baseUrl).hostname]: ['authorization', 'cookie']
        },
        userAgent: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36'
      }
    }),
    supportedClaimTypes: [27], // Video claim type
    settings: [
      {
        variable: 'enableDebugLogging',
        name: 'Enable Debug Logging',
        description: 'Enable detailed logging for debugging purposes',
        type: 'Boolean',
        default: 'false'
      }
    ],
    changelog: {
      '1': ['Initial release']
    },
    // Runtime constants (configurable without rebuilding)
    // Note: platformUrl is already in root config and accessible via config.platformUrl
    constants: {
      baseUrl: config.baseUrl
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
