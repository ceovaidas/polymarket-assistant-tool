// Generates the store's photo set through the kie.ai Market API.
//
//   KIE_API_KEY=... node imagegen/generate.mjs              # all shots
//   KIE_API_KEY=... node imagegen/generate.mjs swatch-      # only ids starting with "swatch-"
//   KIE_API_KEY=... REF_DIR=imagegen/refs node imagegen/generate.mjs
//
// REF_DIR (optional): folder with real sample photos named <mask>.jpg|png (gramps.jpg, cat.jpg …)
// hosted at REF_BASE_URL/<file>. When set, the edit model uses them as a reference so the
// generated photos show the real product instead of an invented one.
//
// The key is read from the environment only. Never commit it — this repository is public.
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.kie.ai/api/v1/jobs';
const KEY = process.env.KIE_API_KEY;
const MODEL = process.env.KIE_MODEL || 'google/nano-banana';
const EDIT_MODEL = process.env.KIE_EDIT_MODEL || 'google/nano-banana-edit';
const REF_BASE_URL = process.env.REF_BASE_URL || '';
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'output');
const filter = process.argv[2] || '';

if (!KEY) {
  console.error('Set KIE_API_KEY in the environment first.');
  process.exit(1);
}

const spec = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const refs = process.env.REF_DIR && existsSync(process.env.REF_DIR)
  ? Object.fromEntries(readdirSync(process.env.REF_DIR).map((f) => [f.replace(/\.\w+$/, ''), f]))
  : {};

// Expand {mask} shots into one job per mask.
const jobs = [];
for (const shot of spec.shots) {
  const masks = shot.each_mask ? Object.keys(spec.masks) : [null];
  for (const m of masks) {
    const id = m ? shot.id.replace('{mask}', m) : shot.id;
    if (filter && !id.startsWith(filter)) continue;
    const prompt = shot.prompt
      .replace('{mask}', m ? spec.masks[m] : '')
      .replace('{gramps_mask}', spec.masks.gramps);
    jobs.push({ id, aspect: shot.aspect, mask: m, prompt: `${prompt}. ${spec.style}.` });
  }
}

async function call(path, init = {}) {
  const res = await fetch(`${API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || (body.code && body.code !== 200)) {
    throw new Error(`${path} -> HTTP ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body.data;
}

async function run(job) {
  const ref = job.mask && refs[job.mask] && REF_BASE_URL ? `${REF_BASE_URL}/${refs[job.mask]}` : null;
  const input = { prompt: job.prompt, output_format: 'png', image_size: job.aspect };
  if (ref) input.image_urls = [ref];
  const { taskId } = await call('createTask', {
    method: 'POST',
    body: JSON.stringify({ model: ref ? EDIT_MODEL : MODEL, input }),
  });

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const info = await call(`recordInfo?taskId=${encodeURIComponent(taskId)}`);
    if (info.state === 'success') {
      const urls = JSON.parse(info.resultJson || '{}').resultUrls || [];
      if (!urls.length) throw new Error(`${job.id}: finished without images`);
      const img = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
      const file = join(outDir, `${job.id}.png`);
      writeFileSync(file, img);
      return file;
    }
    if (info.state === 'fail') throw new Error(`${job.id}: ${info.failMsg || 'generation failed'}`);
  }
  throw new Error(`${job.id}: timed out`);
}

mkdirSync(outDir, { recursive: true });
console.log(`${jobs.length} image(s) with ${Object.keys(refs).length ? EDIT_MODEL + ' + references' : MODEL}`);

// Small concurrency so we don't hammer the API or burn credits on a broken prompt.
const queue = [...jobs];
const failures = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const job = queue.shift();
    try {
      console.log('ok  ', await run(job));
    } catch (e) {
      failures.push(job.id);
      console.error('FAIL', e.message);
    }
  }
}));
if (failures.length) {
  console.error(`\n${failures.length} failed: ${failures.join(', ')}`);
  process.exit(1);
}
