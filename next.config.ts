import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The site moved from inkdub-app.vercel.app to inkdubs.vercel.app; old links land on the same page there.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "inkdub-app.vercel.app" }],
        destination: "https://inkdubs.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
