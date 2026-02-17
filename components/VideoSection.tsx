'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/types';

export default function VideoSection() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(console.error);
  }, []);

  if (videos.length === 0) return null;

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8">Vídeos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map(video => (
          <div key={video.id} className="relative aspect-video">
            {video.type === 'youtube' ? (
              <iframe
                src={getYouTubeEmbedUrl(video.url)}
                title={video.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : video.type === 'vimeo' ? (
              <iframe
                src={video.url.replace('/video/', '/video/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                title={video.title}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={video.url}
                controls
                className="w-full h-full rounded-lg"
                preload="metadata"
              >
                Seu navegador não suporta a tag de vídeo.
              </video>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
