/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["lucide-react"],

  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  // Configure for production deployment
  output: "standalone",
};

export default nextConfig;
