import { GoogleGenAI } from '@google/genai';

export interface GeminiCreds {
  apiKey: string;
}

const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-4.0-generate-001';

function client(creds: GeminiCreds): GoogleGenAI {
  return new GoogleGenAI({ apiKey: creds.apiKey });
}

/** Cheap auth probe — a tiny text generation. */
export async function geminiTest(creds: GeminiCreds): Promise<{ ok: boolean; detail: string }> {
  try {
    const ai = client(creds);
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: 'ping',
    });
    return { ok: !!res, detail: 'เชื่อมต่อ Gemini สำเร็จ' };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Generate an image; returns raw PNG/JPEG bytes (first image) + mime. */
export async function geminiImage(
  creds: GeminiCreds,
  opts: { prompt: string; model?: string },
): Promise<{ bytes: Buffer; mime: string }> {
  const ai = client(creds);
  const res = await ai.models.generateImages({
    model: opts.model || IMAGE_MODEL,
    prompt: opts.prompt,
    config: { numberOfImages: 1 },
  });
  const img = res.generatedImages?.[0]?.image;
  const b64 = img?.imageBytes;
  if (!b64) throw new Error('Gemini returned no image');
  return { bytes: Buffer.from(b64, 'base64'), mime: img?.mimeType || 'image/png' };
}
