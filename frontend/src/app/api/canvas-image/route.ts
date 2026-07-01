import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Allow up to 60s for image generation on Vercel
export const maxDuration = 60;

const IMAGEN_MODELS = [
  "imagen-4.0-fast-generate-001",
  "imagen-4.0-generate-001",
  "imagen-3.0-fast-generate-001",
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ image_url: "" }, { status: 500 });
  }

  let prompt: string;
  try {
    ({ prompt } = await req.json());
  } catch {
    return NextResponse.json({ image_url: "" }, { status: 400 });
  }

  if (!prompt?.trim()) {
    return NextResponse.json({ image_url: "" }, { status: 400 });
  }

  const client = new GoogleGenAI({ apiKey });

  for (const model of IMAGEN_MODELS) {
    try {
      const response = await client.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9",
          outputMimeType: "image/jpeg",
        },
      });
      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        console.log(`[CANVAS IMG] model=${model} ok`);
        return NextResponse.json({
          image_url: `data:image/jpeg;base64,${b64}`,
        });
      }
    } catch (err) {
      console.error(`[CANVAS IMG] model=${model} failed:`, err);
    }
  }

  return NextResponse.json({ image_url: "" });
}
