import { dubPage } from "@/lib/gemma";

export const maxDuration = 300;

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Live dubbing is switched off on this deployment: it has no GEMINI_API_KEY." },
      { status: 503 },
    );
  }
  const { image, cast } = (await request.json().catch(() => ({}))) as { image?: string; cast?: string };
  const match = DATA_URL.exec(image ?? "");
  if (!match) {
    return Response.json({ error: "Send the page as a PNG, JPEG or WebP data URL." }, { status: 400 });
  }
  try {
    return Response.json(await dubPage({ mimeType: match[1], data: match[2] }, cast));
  } catch (error) {
    console.error("dub failed", error);
    return Response.json(
      { error: "Gemma is busy right now. Give it a few seconds and try again." },
      { status: 502 },
    );
  }
}
