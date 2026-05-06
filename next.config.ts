import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcrypt', 'jspdf', 'jspdf-autotable'],
  allowedDevOrigins: ['192.168.220.114', '192.168.220.130', '192.168.*'],
};

export default nextConfig;
