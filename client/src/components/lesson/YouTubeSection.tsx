import React from 'react';
import { YouTubeVideoItem } from '../../types/index.js';
import { Youtube, ExternalLink, Video } from 'lucide-react';
import { Badge } from '../common/Badge.js';

interface YouTubeSectionProps {
  videos: YouTubeVideoItem[];
  source: 'api' | 'cache' | 'curated';
  topic: string;
}

export const YouTubeSection: React.FC<YouTubeSectionProps> = ({ videos, source, topic }) => {
  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Recommended Video Lessons
              <Badge variant={source === 'api' ? 'emerald' : 'slate'} size="sm">
                {source === 'api' ? 'YouTube API v3' : source === 'cache' ? 'Cached' : 'Curated Resources'}
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              High-yield educational video walkthroughs to reinforce concepts
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((video) => (
          <a
            key={video.videoId}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all duration-200"
          >
            <div className="aspect-video relative overflow-hidden bg-slate-950">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback thumbnail if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors" />
              <div className="absolute bottom-2 right-2 bg-slate-950/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <Video className="w-3 h-3 text-red-400" /> Watch
              </div>
            </div>

            <div className="p-3.5">
              <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                {video.title}
              </h4>
              <div className="flex items-center justify-between mt-2.5 text-xs text-slate-400">
                <span className="font-medium text-slate-400 truncate max-w-[140px]">{video.channelTitle}</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  YouTube <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
