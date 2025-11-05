import inquirer from 'inquirer';
import { SourceConfig } from './types';

export async function promptForConfig(): Promise<SourceConfig> {
  console.log('\n🎨 GrayJay Source Generator\n');
  console.log('Let\'s create your source plugin!\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Platform name:',
      default: 'My Platform',
      validate: (input) => input.length > 0 || 'Platform name is required'
    },
    {
      type: 'input',
      name: 'platformUrl',
      message: 'Platform URL (e.g., https://example.com):',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      default: 'A GrayJay source plugin'
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'Bluscream'
    },
    {
      type: 'input',
      name: 'authorUrl',
      message: 'Author URL (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'repositoryUrl',
      message: 'Repository URL:',
      validate: (input) => {
        if (!input) return 'Repository URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: 'Base API URL (e.g., https://api.example.com):',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'list',
      name: 'language',
      message: 'Project language:',
      choices: [
        { name: 'TypeScript (recommended)', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' }
      ],
      default: 'typescript'
    },
    {
      type: 'checkbox',
      name: 'uses',
      message: 'What technologies does this source use?',
      choices: [
        { name: 'REST API', value: 'api', checked: true },
        { name: 'GraphQL', value: 'graphql' },
        { name: 'HTML Parsing/Web Scraping (DOMParser)', value: 'html' },
        { name: 'Algolia Search', value: 'algolia' }
      ],
      validate: (input) => input.length > 0 || 'Please select at least one technology'
    },
    {
      type: 'confirm',
      name: 'hasAuth',
      message: 'Does this source support authentication?',
      default: false
    },
    {
      type: 'confirm',
      name: 'hasLiveStreams',
      message: 'Does this source support live streams?',
      default: false
    },
    {
      type: 'confirm',
      name: 'hasComments',
      message: 'Does this source support comments?',
      default: true
    },
    {
      type: 'confirm',
      name: 'hasPlaylists',
      message: 'Does this source support playlists?',
      default: true
    },
    {
      type: 'confirm',
      name: 'hasSearch',
      message: 'Does this source support search?',
      default: true
    },
    {
      type: 'input',
      name: 'logoUrl',
      message: 'Logo URL (optional, will fetch favicon from platform URL if not provided):',
      default: ''
    },
    {
      type: 'confirm',
      name: 'specifyRepoOptions',
      message: 'Do you want to specify config options used by grayjay-sources.github.io?',
      default: false
    }
  ]);

  // Conditionally ask for repo-specific options
  let repoOptions: any = {};
  if (answers.specifyRepoOptions) {
    repoOptions = await inquirer.prompt([
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated, e.g., "video,music,live"):',
        default: ''
      },
      {
        type: 'confirm',
        name: 'nsfw',
        message: 'Is this source NSFW content?',
        default: false
      },
      {
        type: 'input',
        name: 'generatorUrl',
        message: 'Generator URL (optional, URL to web-based generator):',
        default: ''
      },
      {
        type: 'input',
        name: 'feedsCommits',
        message: 'Commits feed URL (optional):',
        default: ''
      },
      {
        type: 'input',
        name: 'feedsReleases',
        message: 'Releases feed URL (optional):',
        default: ''
      }
    ]);
  }

  return {
    name: answers.name,
    platformUrl: answers.platformUrl,
    description: answers.description,
    author: answers.author,
    authorUrl: answers.authorUrl || undefined,
    repositoryUrl: answers.repositoryUrl,
    baseUrl: answers.baseUrl,
    logoUrl: answers.logoUrl || undefined,
    // Language preference
    typescript: answers.language === 'typescript',
    // Convert uses array to individual flags
    usesApi: answers.uses.includes('api'),
    usesGraphql: answers.uses.includes('graphql'),
    usesHtml: answers.uses.includes('html'),
    usesAlgolia: answers.uses.includes('algolia'),
    // Feature flags
    hasAuth: answers.hasAuth,
    hasLiveStreams: answers.hasLiveStreams,
    hasComments: answers.hasComments,
    hasPlaylists: answers.hasPlaylists,
    hasSearch: answers.hasSearch,
    version: 1,
    // grayjay-sources.github.io specific options
    _tags: repoOptions.tags ? repoOptions.tags.split(',').map((s: string) => s.trim()).filter((s: string) => s) : undefined,
    _nsfw: repoOptions.nsfw || undefined,
    _generatorUrl: repoOptions.generatorUrl || undefined,
    _feeds: (repoOptions.feedsCommits || repoOptions.feedsReleases) ? {
      commits: repoOptions.feedsCommits || undefined,
      releases: repoOptions.feedsReleases || undefined
    } : undefined
  };
}
