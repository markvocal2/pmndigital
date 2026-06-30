import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicCreds {
  mode: 'API_KEY' | 'OAUTH';
  apiKey?: string;
  accessToken?: string; // OAuth (subscription, experimental)
}

const MODEL = 'claude-opus-4-8';

/** Build an Anthropic client for either an API key or a subscription OAuth bearer token. */
function client(creds: AnthropicCreds): Anthropic {
  if (creds.mode === 'OAUTH' && creds.accessToken) {
    // Subscription/OAuth path (like Claude Code / VS Code) — Bearer + the oauth beta header.
    return new Anthropic({
      authToken: creds.accessToken,
      defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
    });
  }
  return new Anthropic({ apiKey: creds.apiKey });
}

/** Cheap auth probe — lists models (no token cost). */
export async function anthropicTest(creds: AnthropicCreds): Promise<{ ok: boolean; detail: string }> {
  try {
    const c = client(creds);
    const res = await c.models.list();
    const n = res.data?.length ?? 0;
    return { ok: true, detail: `เชื่อมต่อสำเร็จ (${creds.mode === 'OAUTH' ? 'subscription' : 'API key'}, ${n} โมเดล)` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Generate text (adaptive thinking). Returns the concatenated text blocks. */
export async function anthropicText(
  creds: AnthropicCreds,
  opts: { system?: string; prompt: string; maxTokens?: number; model?: string },
): Promise<string> {
  const c = client(creds);
  const msg = await c.messages.create({
    model: opts.model || MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    thinking: { type: 'adaptive' },
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}
