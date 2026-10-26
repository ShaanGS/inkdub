import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/card"] },
    sitemap: "https://inkdubs.vercel.app/sitemap.xml",
  };
}
