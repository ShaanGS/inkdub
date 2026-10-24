import type { Metadata } from "next";
import { Anek_Tamil, Baloo_Thambi_2, Dela_Gothic_One, IBM_Plex_Mono, Noto_Sans_Tamil, Shantell_Sans } from "next/font/google";
import "./globals.css";

// Hand lettering for everything a character "says".
const shantell = Shantell_Sans({ variable: "--font-shantell", subsets: ["latin"], weight: ["400", "500", "700", "800"] });
// Chapter titles and the wordmark: a heavy Japanese poster gothic.
const dela = Dela_Gothic_One({ variable: "--font-dela", weight: "400", subsets: ["latin"] });
// Printed labels, captions and buttons.
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
// Tamil lettering inside bubbles: a variable face whose width axis lets long lines run semi-condensed.
const anek = Anek_Tamil({ variable: "--font-anek", subsets: ["tamil", "latin"], axes: ["wdth"] });
// Rounded, heavy Tamil for display moments: sound effects and the closing "to be continued".
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
      className={`${shantell.variable} ${dela.variable} ${plexMono.variable} ${anek.variable} ${baloo.variable} ${notoTamil.variable} h-full antialiased`}
    >
      <body className="paper min-h-full font-sans text-ink">{children}</body>
    </html>
  );
}
