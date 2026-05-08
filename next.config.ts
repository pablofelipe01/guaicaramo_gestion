import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcrypt', 'jspdf', 'jspdf-autotable', 'pdfkit'],
  allowedDevOrigins: ['192.168.220.113', '192.168.220.114', '192.168.220.115', '192.168.220.130'],
};

export default nextConfig;
