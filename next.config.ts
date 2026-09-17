import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // Verhindert das Ausliefern von Source Maps im Production-Build
  productionBrowserSourceMaps: false,
};

export default nextConfig;