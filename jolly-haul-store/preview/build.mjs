// Renders the real Shopify section with mock product data into a static preview page.
// Usage: cd preview && npm install && npm run build  ->  preview/index.html
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const theme = join(here, '..', 'theme');
const read = (p) => readFileSync(join(theme, p), 'utf8');

const sectionSrc = read('sections/gnarhead-product-landing.liquid');
const css = read('assets/gnarhead-landing.css');
const js = read('assets/gnarhead-landing.js');
const template = JSON.parse(read('templates/product.landing.json')).sections.main;
const schema = JSON.parse(sectionSrc.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);

// ---- section settings + blocks (schema defaults, overridden by the template) ----
const defaults = (settings) => Object.fromEntries(settings.filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
const settings = { ...defaults(schema.settings), ...template.settings };
const blocks = template.block_order.map((id) => {
  const b = template.blocks[id];
  const def = schema.blocks.find((d) => d.type === b.type);
  return { id, type: b.type, shopify_attributes: '', settings: { ...defaults(def.settings), ...b.settings } };
});

// ---- mock product (no photos yet -> placeholders render) ----
const faces = ['Gramps', 'The Cat', 'Tiger', 'Corgi', 'The Elf'];
const variants = faces.map((f, i) => ({
  id: 1000 + i, title: f, options: [f], price: 3999, compare_at_price: 0, available: true, featured_media: null,
}));
const product = {
  title: 'The Gnarhead',
  has_only_default_variant: false,
  options_with_values: [{ name: 'Face', values: faces, selected_value: faces[0] }],
  variants,
  selected_or_first_available_variant: variants[0],
  media: [],
  featured_media: null,
  metafields: { reviews: { rating: { value: null }, rating_count: null } },
  description: '<p>Every ski trip has <em>that</em> photo. This is how you end up in it.</p><ul><li>Double-layer knit, fleece-lined face</li><li>Wide, goggle-ready eye port</li><li>Breathable mouth zone</li><li>Fits under most helmets</li><li>Ships in a drawstring pouch</li></ul>',
};

// ---- engine with Shopify shims ----
const engine = new Liquid({ root: [join(theme, 'snippets')], extname: '.liquid' });
const noop = () => '';
engine.registerFilter('money', (c) => '$' + (Number(c) / 100).toFixed(2));
['asset_url', 'stylesheet_tag', 'image_url', 'image_tag', 'video_tag', 'media_tag', 'payment_terms'].forEach((f) => engine.registerFilter(f, noop));

function blockTag(name, open, close) {
  engine.registerTag(name, {
    parse(token, remain) {
      this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain)
        .on(`tag:end${name}`, () => stream.stop())
        .on('template', (t) => this.tpls.push(t))
        .on('end', () => { throw new Error(`${name} not closed`); });
      stream.start();
    },
    * render(ctx, emitter) {
      if (open === null) return;
      emitter.write(open);
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      emitter.write(close);
    },
  });
}
blockTag('form', '<form method="post" action="/cart/add" data-gh-form="true" onsubmit="event.preventDefault(); alert(\'Preview only — in Shopify this adds to cart.\')">', '</form>');
blockTag('schema', null, null);

const body = await engine.parseAndRender(sectionSrc, {
  product, section: { id: 'preview', settings, blocks }, shop: { money_format: '${{amount}}', name: 'GNARHEAD' },
});

const cleaned = body.replace(/<script src="[^"]*" defer><\/script>/, '');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GNARHEAD Preview</title>
<meta name="description" content="Design preview of the GNARHEAD one-product Shopify page, rendered from the real section code.">
<style>
${css}
/* preview-only stand-in for the theme header (Dawn renders its own) */
body { margin: 0; background: #fff; }
.pv-head { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid var(--line); }
.pv-head__in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 64px; }
.pv-nav { display: none; gap: 26px; font-weight: 600; font-size: 15px; }
.pv-nav a { text-decoration: none; }
@media (min-width: 990px) { .pv-nav { display: flex; } .pv-burger { display: none !important; } }
.pv-logo { font-weight: 900; font-size: 28px; letter-spacing: -.04em; text-decoration: none; }
.pv-logo span { color: var(--pop); }
.pv-icons { justify-self: end; display: flex; gap: 18px; }
.pv-icons svg { width: 24px; height: 24px; }
.pv-burger { display: inline-block; width: 24px; height: 12px; border-top: 2.5px solid; border-bottom: 2.5px solid; border-radius: 1px; }
</style>
</head>
<body>
<div class="gh">
  <header class="pv-head"><div class="gh-wrap pv-head__in">
    <div><span class="pv-burger" aria-hidden="true"></span><nav class="pv-nav"><a href="#">Shop</a><a href="#">The Crew</a><a href="#">FAQ</a></nav></div>
    <a class="pv-logo" href="#">gnarhead<span>.</span></a>
    <div class="pv-icons" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0"/></svg>
    </div>
  </div></header>
</div>
${cleaned}
<script>
${js}
</script>
</body>
</html>
`;
writeFileSync(join(here, 'index.html'), html);
console.log('wrote preview/index.html');
