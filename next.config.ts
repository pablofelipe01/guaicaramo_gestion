import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcrypt'],
  allowedDevOrigins: ['192.168.220.130'],
};

export default nextConfig;
