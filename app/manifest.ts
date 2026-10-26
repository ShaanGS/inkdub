import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inkdub",
    short_name: "Inkdub",
    description: "Read any comic in Tamil, Tanglish or Madras Bashai, lettered inside the speech bubbles by Gemma 4.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ecdf",
    theme_color: "#f2ecdf",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
