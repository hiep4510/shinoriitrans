export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SuicaoDex',
    short_name: 'SuicaoDex',
    description: '"Ứng dụng" đọc truyện đầu hàng Vi En',
    start_url: '/',
    display: 'standalone',
    icons: [
      {
        src: '/icon/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
