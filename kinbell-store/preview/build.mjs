// Renders the real landing sections with sample data into preview/index.html.
// Usage: cd preview && npm install liquidjs && node build.mjs   (photos: preview/img/1.jpg …)
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const theme = join(here, '..', 'theme');
const read = (p) => readFileSync(join(theme, p), 'utf8');

const engine = new Liquid({ root: [join(theme, 'snippets')], extname: '.liquid' });
engine.registerFilter('money', (c) => '$' + (Number(c) / 100).toFixed(2));
engine.registerFilter('asset_url', (n) => 'assets/' + n);
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('image_url', (img) => (img && img.src) || '');
engine.registerFilter('image_tag', (src, ...args) => {
  const o = Object.fromEntries(args.filter(Array.isArray));
  return `<img src="${src}" alt="${o.alt ?? ''}" loading="${o.loading ?? 'lazy'}">`;
});
engine.registerFilter('placeholder_svg_tag', () => '<svg viewBox="0 0 100 100"><rect width="100" height="100"/></svg>');
engine.registerFilter('payment_type_svg_tag', () => '');
engine.registerTag('form', {
  parse(token, remain) {
    this.tpls = [];
    const s = this.liquid.parser.parseStream(remain).on('tag:endform', () => s.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
    s.start();
  },
  * render(ctx, emitter) {
    emitter.write('<form class="kb-form" method="post" action="/cart/add" onsubmit="event.preventDefault(); alert(\'Preview: in Shopify this goes straight to checkout with the chosen set.\')">');
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
  },
});
engine.registerTag('schema', { parse(t, remain) { const s = this.liquid.parser.parseStream(remain).on('tag:endschema', () => s.stop()).on('end', () => {}); s.start(); }, render() {} });

function section(file, tplSettings = {}, tplBlocks = {}, order = []) {
  const src = read(`sections/${file}`);
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  const defaults = (list) => Object.fromEntries((list || []).filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
  const blocks = order.map((id) => {
    const b = tplBlocks[id];
    const def = (schema.blocks || []).find((d) => d.type === b.type) || {};
    return { id, type: b.type, settings: { ...defaults(def.settings), ...b.settings }, shopify_attributes: '' };
  });
  return { src, data: { id: file, settings: { ...defaults(schema.settings), ...tplSettings }, blocks } };
}

// Sample data: photos are placeholders until the real product is imported.
const imgDir = join(here, 'img');
const photos = existsSync(imgDir) ? readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp)$/.test(f)).sort() : [];
const media = photos.map((f, i) => ({ preview_image: { src: `img/${f}` }, alt: `Product photo ${i + 1}` }));
const variants = [
  { id: 1, title: 'US Plug', price: 5999, available: true },
  { id: 2, title: 'EU Plug', price: 5999, available: true },
  { id: 3, title: 'UK Plug', price: 5999, available: true },
];
const product = {
  title: 'SOS Call Button for Seniors', media, variants, has_only_default_variant: false,
  options: ['Plug'], selected_or_first_available_variant: variants[0],
  // AliExpress listing at the time of writing: 4.6 stars from 41 reviews.
  metafields: { reviews: { rating: { value: 4.6 }, rating_count: { value: 41 } } },
};
const ctx = {
  shop: { name: 'Kinbell', email: 'hello@kinbell.com', policies: [{ title: 'Refund policy', url: '#' }, { title: 'Shipping policy', url: '#' }, { title: 'Privacy policy', url: '#' }, { title: 'Terms of service', url: '#' }], enabled_payment_types: [] },
  routes: { root_url: '', cart_url: '#' }, cart: { item_count: 0 }, product: null,
};

const tpl = JSON.parse(read('templates/index.json')).sections.main;
const land = section('kb-landing.liquid', tpl.settings, tpl.blocks, tpl.block_order);
land.data.settings.product = product;
const head = section('kb-header.liquid');
const foot = section('kb-footer.liquid');

const html = [
  await engine.parseAndRender(head.src, { ...ctx, section: head.data }),
  await engine.parseAndRender(land.src, { ...ctx, section: land.data }),
  await engine.parseAndRender(foot.src, { ...ctx, section: foot.data }),
].join('\n').replace(/\n\s*\n+/g, '\n');

mkdirSync(join(here, 'assets'), { recursive: true });
for (const f of ['kb.css', 'kb.js']) copyFileSync(join(theme, 'assets', f), join(here, 'assets', f));
writeFileSync(join(here, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kinbell</title><style>body{margin:0;background:#faf7f2}</style></head><body>${html}</body></html>`);
console.log('wrote preview/index.html with', media.length, 'photos');
