/**
 * Credits and model prices. 1 credit = $0.01 retail.
 * providerUsdPerSec is what the AI provider charges us (kie.ai list prices, October 2026 —
 * re-check before launch). creditsPerSec is what users pay; the gap is the margin.
 */
export const CREDIT_USD = 0.01;

export type ModelId = 'seedance-2-fast' | 'seedance-2';

export const MODELS: Record<ModelId, {
  label: string;
  providerModel: string;
  providerUsdPerSec: number;
  creditsPerSec: number;
  minSec: number;
  maxSec: number;
}> = {
  'seedance-2-fast': { label: 'Seedance 2.0 Fast · 720p', providerModel: 'bytedance/seedance-2-fast', providerUsdPerSec: 0.12, creditsPerSec: 18, minSec: 4, maxSec: 15 },
  'seedance-2': { label: 'Seedance 2.0 · 720p', providerModel: 'bytedance/seedance-2', providerUsdPerSec: 0.205, creditsPerSec: 28, minSec: 4, maxSec: 15 },
};

export function jobCost(model: ModelId, seconds: number): number {
  return Math.ceil(MODELS[model].creditsPerSec * seconds);
}

export const PACKS = [
  { id: 'starter', credits: 1000, usd: 10, label: 'Starter' },
  { id: 'creator', credits: 3300, usd: 29, label: 'Creator', note: '+10% bonus' },
  { id: 'studio', credits: 12000, usd: 99, label: 'Studio', note: '+20% bonus' },
] as const;
export type PackId = (typeof PACKS)[number]['id'];
