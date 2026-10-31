import type { Metadata } from "next";

// A page that sets openGraph or twitter replaces the layout's whole object, image included, so every
// page builds its share preview here and keeps the poster card.
const image = { url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "Inkdub: anime gets dubs, manga never did" };

export const shareMeta = (title: string, description: string): Metadata => ({
  title,
  description,
  openGraph: { title, description, siteName: "Inkdub", type: "website", images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
});
