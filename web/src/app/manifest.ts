import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '한자 공부',
    short_name: '한자공부',
    description: '초등 한자(어문회 8급~5급) 키즈 학습',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0f9ff',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
