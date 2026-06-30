/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  experimental: {
    typedRoutes: true,
    staticGenerationMaxConcurrency: 1,
    serverActions: {
      bodySizeLimit: "12mb"
    }
  }
};

export default nextConfig;
