// Renders the real landing sections with sample data into preview/index.html.
// Usage: cd preview && npm install liquidjs && node build.mjs   (photos: preview/img/1.jpg …)
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const theme = join(here, '..', 'theme');
const read = (p) => readFileSync(join(theme, p), 'utf8');

// STORE_DIR=../angel-store node build.mjs renders another store that reuses these sections (see below);
// its own theme/snippets and theme/sections win over the shared ones.
const storeDir = process.env.STORE_DIR ? join(process.cwd(), process.env.STORE_DIR) : join(here, '..');
const engine = new Liquid({ root: [join(storeDir, 'theme', 'snippets'), join(theme, 'snippets')], extname: '.liquid' });
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
  const src = storeRead(`sections/${file}`);
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
// STORE_DIR=../angel-store node build.mjs renders another store that reuses these sections:
// it brings its own theme/templates, theme/assets/kb-brand.css and preview/store.json (sample data).
const out = join(storeDir, 'preview');
const storeRead = (p) => { const f = join(storeDir, 'theme', p); return existsSync(f) ? readFileSync(f, 'utf8') : read(p); };
const cfgFile = join(out, 'store.json');
const cfg = existsSync(cfgFile) ? JSON.parse(readFileSync(cfgFile, 'utf8')) : {
  shop: { name: 'Kinbell', email: 'hello@kinbell.com' },
  product: { title: 'SOS Call Button for Seniors', option: 'Plug', price: 5999, variants: ['US Plug', 'EU Plug', 'UK Plug'], rating: 4.6, rating_count: 41 },
};
const imgDir = join(out, 'img');
const photos = existsSync(imgDir) ? readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp)$/.test(f)).sort() : [];
const media = photos.map((f, i) => ({ preview_image: { src: `img/${f}` }, alt: `Product photo ${i + 1}` }));
const variants = cfg.product.variants.map((t, i) => ({ id: i + 1, title: t, price: cfg.product.price, available: true }));
const product = {
  title: cfg.product.title, media, featured_media: media[0], variants, has_only_default_variant: variants.length < 2,
  options: [cfg.product.option], selected_or_first_available_variant: variants[0],
  metafields: cfg.product.rating ? { reviews: { rating: { value: cfg.product.rating }, rating_count: { value: cfg.product.rating_count } } } : {},
};
const ctx = {
  shop: { ...cfg.shop, policies: [{ title: 'Refund policy', url: '#' }, { title: 'Shipping policy', url: '#' }, { title: 'Privacy policy', url: '#' }, { title: 'Terms of service', url: '#' }], enabled_payment_types: [] },
  routes: { root_url: '', cart_url: '#' }, cart: { item_count: 0 }, product: null,
};

const tpl = JSON.parse(storeRead('templates/index.json')).sections.main;
const land = section('kb-landing.liquid', tpl.settings, tpl.blocks, tpl.block_order);
land.data.settings.product = product;
if (cfg.combo) { // optional second product for a store's combo card (toetally-store)
  const cvars = cfg.combo.variants.map((t, i) => ({ id: 100 + i, title: t, price: cfg.combo.price, available: true, options: t.split(' / ') }));
  const onames = cfg.combo.options || ['Color', 'Size'];
  const owv = onames.map((name, k) => ({ name, values: [...new Set(cvars.map((v) => v.options[k]))] }));
  const cimg = cfg.combo.image ? { preview_image: { src: cfg.combo.image } } : media[0];
  ctx.all_products = { [cfg.combo.handle]: { title: cfg.combo.title, variants: cvars, options_with_values: owv, selected_or_first_available_variant: cvars[0], featured_media: cimg } };
}
const head = section('kb-header.liquid', cfg.header || {});
const foot = section('kb-footer.liquid', cfg.footer || {});

const html = [
  await engine.parseAndRender(head.src, { ...ctx, section: head.data }),
  await engine.parseAndRender(land.src, { ...ctx, section: land.data }),
  await engine.parseAndRender(foot.src, { ...ctx, section: foot.data }),
].join('\n').replace(/\n\s*\n+/g, '\n');

mkdirSync(join(out, 'assets'), { recursive: true });
for (const f of ['kb.css', 'kb.js']) copyFileSync(join(theme, 'assets', f), join(out, 'assets', f));
writeFileSync(join(out, 'assets', 'kb-brand.css'), storeRead('assets/kb-brand.css'));
const storeAssets = join(storeDir, 'theme', 'assets');
if (existsSync(storeAssets)) for (const f of readdirSync(storeAssets).filter((n) => /\.(png|jpe?g|svg|webp|js)$/.test(n))) copyFileSync(join(storeAssets, f), join(out, 'assets', f));
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${cfg.shop.name}</title><style>body{margin:0;background:#fff}</style></head><body>${html}</body></html>`);
console.log('wrote', join(out, 'index.html'), 'with', media.length, 'photos');
