/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: false
  },
  output: 'standalone'
};
module.exports = nextConfig;
