/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keeping project-specific settings that are unlikely to cause the build error.
  reactStrictMode: false,

  // Rewrites are essential for the hybrid model and API proxy.
  // This configuration is based on the `nexfaster` reference implementation.
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Proxies API calls to the backend service.
        destination: "http://localhost:4000/api/:path*",
      },
      {
        // The "shell" rewrite for the client-side router.
        source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
        destination: "/shell",
      },
    ];
  },

  // Image configuration is for content and should not affect the build process
  // related to page rendering.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // The following configurations have been removed to align with the simpler
  // `nexfaster` setup and resolve the build error:
  // - `output: "standalone"`
  // - `skipMiddlewareUrlNormalize: true`
  // - `transpilePackages`
  // - `webpack` config for WASM
  // - `headers`
  // - `turbopack`
};

export default nextConfig;
