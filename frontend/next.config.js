/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用standalone输出模式用于Docker部署
  output: 'standalone',
  
  // 忽略构建时的TypeScript和ESLint错误，加快部署速度
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  },
  webpack: (config, { isServer }) => {
    // Fix for has-tostringtag module issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/homework/:path*',
        destination: 'https://ezijingai.oss-cn-beijing.aliyuncs.com/homework/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://ezijingai.oss-cn-beijing.aliyuncs.com/uploads/:path*',
      },
      {
        source: '/ai-creation/:path*',
        destination: 'https://ezijingai.oss-cn-beijing.aliyuncs.com/ai-creation/:path*',
      },
      {
        source: '/teaching_resources/:path*',
        destination: 'https://ezijingai.oss-cn-beijing.aliyuncs.com/teaching_resources/:path*',
      },
    ]
  },
}

module.exports = nextConfig
