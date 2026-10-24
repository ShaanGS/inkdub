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
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
