import * as z from 'zod/v4';

// What Claude returns after studying a viral video. Text only: the footage itself is never reused.
export const Template = z.object({
  title: z.string().describe('Short name for this format, e.g. "3-2-1 reveal, then it goes everywhere"'),
  summary: z.string().describe('One or two sentences: what happens in the video'),
  why_it_works: z.string().describe('Hook, build-up and payoff in plain words'),
  reference: z.object({
    niche: z.string().describe('e.g. "Beauty / skincare", "Pets / cat beds"'),
    audience: z.string().describe('Who watches and buys, e.g. "Women 25-40 who saw the product online and finally find it"'),
  }),
  hook: z.object({
    seconds: z.number().describe('How long the hook lasts'),
    said: z.string().describe('Words spoken in the hook, 1:1, or "" if none'),
    on_screen_text: z.string().describe('The opening on-screen text exactly as written in the video (1:1), or "" if none'),
    seen: z.string().describe('What the viewer sees in the hook'),
    mechanic: z.string().describe('Why the first 2 seconds stop the scroll'),
    reusable_text: z.string().describe('The same hook with the product/audience words turned into {SLOTS}'),
  }),
  beats: z.array(z.object({
    n: z.number().int(),
    start: z.number(),
    end: z.number(),
    action: z.string().describe('One simple action, e.g. "Freezes and points at the shelf"'),
    shot: z.string().describe('Distance and camera, e.g. "Medium · Handheld, push-in"'),
    emotion: z.string().describe('e.g. "Shock", "Joy", "Relief"'),
    on_screen_text: z.string(),
    sound: z.string().describe('e.g. "Gasp", "Trending audio", "Tape rip"'),
    purpose: z.enum(['hook', 'build-up', 'payoff', 'cta']),
  })),
  mirror: z.object({
    kept: z.string().describe('What our version keeps exactly (the beats that make it work)'),
    stronger: z.string().describe('One or two concrete upgrades that make it hit harder'),
    visuals: z.string().describe('Look of our version: place, light, palette'),
    set: z.string().describe('How the set is dressed around {PRODUCT}'),
  }).describe('Our sharper version of the same video, regenerated from scratch'),
  music: z.object({
    original: z.string().describe('Track name if known, else a description of the sound'),
    beat_drop_s: z.number().describe('Second where the main beat drop or reveal lands'),
  }),
  cta: z.string().describe('End-screen call to action as written in the video, or "" if none'),
  slots: z.array(z.string()).describe('Placeholders a new version must fill, e.g. {PRODUCT}, {PERSON}, {PET}, {VENUE}'),
  risks: z.array(z.string()).describe('Brand logos, fake claims, animal or person safety, product misuse to avoid'),
  angles: z.array(z.object({
    setting: z.string(),
    concept: z.string(),
    hook: z.string(),
  })).describe('4-5 new worlds for the same structure'),
});
export type Template = z.infer<typeof Template>;

// The numbered build order the user follows step by step.
export const Plan = z.object({
  product_sentence: z.string().describe('The exact product description pasted into every prompt'),
  characters: z.array(z.string()).describe('Exact person and pet sentences pasted into every prompt'),
  steps: z.array(z.object({
    n: z.number().int(),
    kind: z.enum(['prep', 'image', 'check', 'video', 'edit']),
    title: z.string().describe('e.g. "IMAGE · Shot 2 (anchor: person + pet + product)"'),
    where: z.string().describe('Tool to use, e.g. "Seedream / Kling Image" or "Kling Video, Start + End frame"'),
    uploads: z.array(z.string()).describe('What to attach, in order'),
    prompt: z.string().describe('Complete, self-contained prompt. Empty for prep/check steps'),
    negative: z.string().describe('Negative prompt for video steps, else ""'),
    length: z.string().describe('For video steps: "5 s, use 0.5-3 s"; else ""'),
    checks: z.array(z.string()).describe('2-3 things the user verifies before the next step'),
  })),
  on_screen_texts: z.array(z.object({ time: z.string(), text: z.string() })),
  music: z.array(z.string()).describe('2-3 track suggestions, first is the recommendation'),
  caption: z.string(),
  pinned_comment: z.string(),
  hashtags: z.array(z.string()),
  cost_note: z.string().describe('Rough credit estimate: images + clips, cheaper multi-shot option'),
});
export type Plan = z.infer<typeof Plan>;
