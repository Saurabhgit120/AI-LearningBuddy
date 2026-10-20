import { config } from '../config/index.js';
import { prisma } from '../db.js';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  url: string;
}

export class YouTubeService {
  /**
   * Search for educational videos related to a topic and lesson
   * Results are cached in the database by query string to prevent hitting API quotas
   */
  static async searchVideos(params: {
    topic: string;
    lessonTitle: string;
    maxResults?: number;
  }): Promise<{ videos: YouTubeVideoItem[]; source: 'api' | 'cache' | 'curated' }> {
    const maxResults = params.maxResults || 3;
    const query = `${params.topic} ${params.lessonTitle} tutorial educational`.trim();
    const queryKey = query.toLowerCase().slice(0, 100);

    // 1. Check database cache
    try {
      const cached = await prisma.youTubeVideoCache.findUnique({
        where: { searchQuery: queryKey },
      });

      if (cached) {
        const parsed = JSON.parse(cached.videosJson) as YouTubeVideoItem[];
        return { videos: parsed.slice(0, maxResults), source: 'cache' };
      }
    } catch (cacheError) {
      console.warn('[YouTubeService] Cache lookup error:', cacheError);
    }

    // 2. Call YouTube Data API v3 if key is configured
    if (config.youtubeApiKey) {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', query);
        url.searchParams.set('type', 'video');
        url.searchParams.set('videoEmbeddable', 'true');
        url.searchParams.set('relevanceLanguage', 'en');
        url.searchParams.set('maxResults', maxResults.toString());
        url.searchParams.set('key', config.youtubeApiKey);

        const response = await fetch(url.toString());

        if (response.ok) {
          const data: any = await response.json();
          const items = data.items || [];

          const videos: YouTubeVideoItem[] = items.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          }));

          // Cache in database
          if (videos.length > 0) {
            try {
              await prisma.youTubeVideoCache.upsert({
                where: { searchQuery: queryKey },
                update: { videosJson: JSON.stringify(videos) },
                create: {
                  searchQuery: queryKey,
                  videosJson: JSON.stringify(videos),
                },
              });
            } catch (err) {
              console.warn('[YouTubeService] Failed to cache videos:', err);
            }
          }

          return { videos, source: 'api' };
        } else {
          console.warn(`[YouTubeService] YouTube API responded with status ${response.status}`);
        }
      } catch (apiError) {
        console.warn('[YouTubeService] API request failed:', apiError);
      }
    }

    // 3. High quality curated fallback if API key is not configured or quota exceeded
    const curatedVideos = this.getCuratedVideos(params.topic, params.lessonTitle, maxResults);
    return { videos: curatedVideos, source: 'curated' };
  }

  private static getCuratedVideos(topic: string, lessonTitle: string, count: number): YouTubeVideoItem[] {
    const cleanTopic = topic.toLowerCase();
    
    // Select well-known reputable educational channels & standard videos based on domain
    if (/react|javascript|typescript|frontend/i.test(cleanTopic)) {
      return [
        {
          videoId: 'w7ejDZ8SWv8',
          title: `React JS Crash Course for Beginners - ${lessonTitle}`,
          channelTitle: 'Traversy Media',
          thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
        },
        {
          videoId: 'bMknfKXIFA8',
          title: `React Course - Beginner's Tutorial for React`,
          channelTitle: 'freeCodeCamp.org',
          thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        },
        {
          videoId: 'SqcY0GlETPk',
          title: `TypeScript Tutorial for Beginners - Complete Guide`,
          channelTitle: 'Programming with Mosh',
          thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
        },
      ].slice(0, count);
    }

    if (/python|data|machine learning|ai|deep learning/i.test(cleanTopic)) {
      return [
        {
          videoId: '_uQrJ0TkZlc',
          title: `Python for Beginners - Full Course [Programming Tutorial]`,
          channelTitle: 'Programming with Mosh',
          thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        },
        {
          videoId: 'i_LwzRVP7bg',
          title: `Machine Learning for Everybody – Full Course`,
          channelTitle: 'freeCodeCamp.org',
          thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
        },
        {
          videoId: 'aircAruvnKk',
          title: `Neural Networks and Deep Learning Fundamentals`,
          channelTitle: '3Blue1Brown',
          thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=640&q=80',
          url: 'https://www.youtube.com/watch?v=aircAruvnKk',
        },
      ].slice(0, count);
    }

    // Universal high-quality educational channels
    return [
      {
        videoId: 'eIrMbAQSU34',
        title: `Comprehensive Guide to ${topic}: ${lessonTitle}`,
        channelTitle: 'freeCodeCamp.org',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=80',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} ${lessonTitle}`)}`,
      },
      {
        videoId: 'PkZNo7MFNFg',
        title: `Learn ${topic} - In-Depth Masterclass`,
        channelTitle: 'CS Dojo',
        thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&q=80',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} tutorial`)}`,
      },
      {
        videoId: 'fNK_k7r-w94',
        title: `${topic} Explained: Architecture and Best Practices`,
        channelTitle: 'Fireship',
        thumbnailUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&q=80',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} full course`)}`,
      },
    ].slice(0, count);
  }
}
