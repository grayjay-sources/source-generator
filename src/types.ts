export interface SourceConfig {
  name: string;
  platformUrl: string;
  description: string;
  author: string;
  authorUrl?: string;
  repositoryUrl: string;
  baseUrl: string;
  logoUrl?: string; // Logo URL (auto-resolved from favicon if not provided)
  // Technology flags
  usesApi?: boolean;
  usesGraphql?: boolean;
  usesHtml?: boolean; // Includes web scraping (both use DOMParser)
  usesAlgolia?: boolean;
  // Feature flags (all optional, only enabled if explicitly requested)
  hasAuth?: boolean;
  hasLiveStreams?: boolean;
  hasComments?: boolean;
  hasPlaylists?: boolean;
  hasSearch?: boolean;
  version?: number;
  // grayjay-sources.github.io specific options (prefixed with _)
  _tags?: string[];
  _nsfw?: boolean;
  _generatorUrl?: string;
  _feeds?: {
    commits?: string;
    releases?: string;
  };
  _customButtons?: Array<{
    text: string;
    url: string;
    classes?: string;
  }>;
}

export interface GeneratorOptions {
  outputDir: string;
  config: SourceConfig;
  typescript?: boolean;
  interactive?: boolean;
}

export interface PluginCapabilities {
  useGraphQL: boolean;
  useAPI: boolean;
  useHTML: boolean; // Covers both HTML parsing and web scraping
  useAlgolia: boolean;
  hasAuth: boolean;
  hasLiveStreams: boolean;
  hasComments: boolean;
  hasPlaylists: boolean;
  hasSearch: boolean;
}
