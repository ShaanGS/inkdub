import type { Metadata } from "next";
import { Baloo_Thambi_2, Dela_Gothic_One, Geist, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const dela = Dela_Gothic_One({ variable: "--font-dela", weight: "400", subsets: ["latin"] });
// Rounded, bold Tamil that reads like hand lettering inside a speech bubble.
const baloo = Baloo_Thambi_2({
  variable: "--font-baloo-thambi",
  subsets: ["tamil", "latin"],
  weight: ["500", "600", "700", "800"],
});
const notoTamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil"], weight: ["400", "600", "700"] });

const description =
  "Inkdub letters any comic page into natural Tamil, Tanglish or Madras Bashai, right inside the speech bubbles. Powered by Gemma 4, an open model.";

export const metadata: Metadata = {
  metadataBase: new URL("https://inkdub-app.vercel.app"),
  title: "Inkdub · Anime gets dubs. Manga never did.",
  description,
  openGraph: {
    title: "Inkdub · Anime gets dubs. Manga never did.",
    description,
    siteName: "Inkdub",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Inkdub · Anime gets dubs. Manga never did.", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${dela.variable} ${baloo.variable} ${notoTamil.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink font-sans text-paper">{children}</body>
    </html>
  );
}
