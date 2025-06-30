import { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Next.js to look for pages in the web app directory
  distDir: ".next",
  // Enable Turbopack (now stable)
  turbopack: {},
  // Disable ESLint during build to avoid parsing errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Experimental features
  experimental: {
    // This is necessary for monorepo support
    externalDir: true,
    // Support for server components in edge runtime
    serverComponentsExternalPackages: ["better-auth", "postgres"],
  },
  // Webpack configuration for module resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Map '@' alias to the web app's src directory
      "@": path.resolve(__dirname, "./apps/web/src"),
    };
    return config;
  },
  // URL rewrites configuration
  rewrites: async () => {
    return [
      {
        source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
        destination: "/shell",
      },
    ];
  },
  // Make environment variables available to Edge Runtime
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
};

export default nextConfig;
