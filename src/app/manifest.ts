
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Legacy AI',
    short_name: 'Legacy',
    description: 'Advanced AI Core with Intelligent Native Automation',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a050d',
    theme_color: '#9d4edd',
    icons: [
      {
        src: 'https://picsum.photos/seed/legacy-logo-core/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/legacy-logo-core/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
