

// Mapper functions convert platform-specific data structures to GrayJay types

export function assetToGrayjayVideo(
  pluginId: string,
  asset: any
): PlatformVideo {
  const videoId = asset.id || '';
  const title = asset.title || asset.name || 'Untitled';
  const duration = asset.duration || 0;
  
  // Build thumbnail URL
  const thumbnail = asset.image || asset.thumbnail || '';
  
  // Build video URL
  const platformName = plugin.config?.name || '{{PLATFORM_NAME}}';
  const platformUrl = plugin.config?.platformUrl || '';
  const url = asset.url || `${platformUrl}/video/${videoId}`;
  
  // Create author/channel link
  const author = asset.channel || asset.author
    ? new PlatformAuthorLink(
        new PlatformID(platformName, asset.channel?.id || asset.author?.id || '', pluginId, 3),
        asset.channel?.name || asset.author?.name || '',
        asset.channel?.url || asset.author?.url || '',
        asset.channel?.avatar || asset.author?.avatar || '',
        asset.channel?.subscribers || 0
      )
    : new PlatformAuthorLink(
        new PlatformID(platformName, 'unknown', pluginId, 3),
        platformName,
        platformUrl,
        '',
        0
      );
  
  // Parse upload date
  const uploadDate = asset.publishedAt || asset.createdAt || asset.uploadDate
    ? Math.floor(new Date(asset.publishedAt || asset.createdAt || asset.uploadDate).getTime() / 1000)
    : 0;
  
  const video: PlatformVideoDef = {
    id: new PlatformID(platformName, videoId, pluginId, 3),
    name: title,
    thumbnails: new Thumbnails([new Thumbnail(thumbnail, 0)]),
    author,
    uploadDate,
    duration,
    viewCount: asset.views || asset.viewCount || 0,
    url,
    isLive: asset.isLive || false,
  };
  
  return new PlatformVideo(video);
}

export function channelToGrayjayChannel(
  pluginId: string,
  channel: any,
  url?: string
): PlatformChannel {
  const channelId = channel.id || '';
  const channelName = channel.name || channel.displayName || 'Unknown Channel';
  const thumbnail = channel.avatar || channel.thumbnail || channel.image || '';
  const banner = channel.banner || channel.cover || '';
  const subscribers = channel.subscribers || channel.followerCount || 0;
  
  const platformName = plugin.config?.name || '{{PLATFORM_NAME}}';
  const platformUrl = plugin.config?.platformUrl || '';
  const channelUrl = url || channel.url || `${platformUrl}/channel/${channelId}`;
  
  return new PlatformChannel({
    id: new PlatformID(platformName, channelId, pluginId, 3),
    name: channelName,
    thumbnail,
    banner,
    subscribers,
    description: channel.description || '',
    url: channelUrl,
    urlAlternatives: [channelUrl],
    links: channel.links || {},
  });
}
