const nextConfig = {
  experimental: {
    runtime: 'edge',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  //output: 'export', // 🧩 Thêm dòng này nè
};

export default nextConfig;
