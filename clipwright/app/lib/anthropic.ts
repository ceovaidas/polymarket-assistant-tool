import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type * as z from 'zod/v4';
import { env } from '@/lib/env';

export const LAB_MODEL = 'claude-opus-5-5';

let client: Anthropic | null = null;
function anthropic() {
  if (!client) client = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') });
  return client;
}

/**
 * One structured call: the reply is validated against `schema`.
 * A policy decline is retried server-side on Anthropic's recommended fallback model (`fallbacks: "default"`).
 */
export async function structuredCall<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[];
}): Promise<z.infer<S>> {
  const res = await anthropic().beta.messages.parse({
    model: LAB_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(opts.schema) },
    system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: opts.content }],
  });
  if (res.stop_reason === 'refusal') throw new Error('The model declined this video. Try another one.');
  if (res.stop_reason === 'max_tokens') throw new Error('The answer was too long. Try a shorter video.');
  if (!res.parsed_output) throw new Error('Could not read the answer. Try again.');
  return res.parsed_output;
}
