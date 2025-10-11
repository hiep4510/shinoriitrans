/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👈 xuất static site thay cho `next export`
  images: {
    unoptimized: true, // cần cho Cloudflare Pages
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
