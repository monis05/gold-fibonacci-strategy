/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents dual mount of TradingView canvas during development
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
