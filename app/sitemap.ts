import type { MetadataRoute } from "next";

const BASE = "https://inkdub-app.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/read", "/dub"].map((path) => ({ url: `${BASE}${path}`, changeFrequency: "weekly" }));
}
