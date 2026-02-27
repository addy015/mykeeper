/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Increased body size limit for large file uploads
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
