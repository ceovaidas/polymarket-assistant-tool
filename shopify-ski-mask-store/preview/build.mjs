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
/* preview-only stand-ins for the theme's announcement bar and header */
body { margin: 0; background: #f2efe8; }
.pv-head { position: sticky; top: 0; z-index: 30; background: var(--paper); border-bottom: 1px solid var(--line); }
.pv-head__in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 60px; }
.pv-nav { display: none; gap: 28px; }
.pv-nav a { text-decoration: none; }
@media (min-width: 990px) { .pv-nav { display: flex; } .pv-burger { display: none; } }
@media (max-width: 749px) { .pv-search { display: none; } }
.pv-logo { font-size: 26px; letter-spacing: .02em; text-decoration: none; }
.pv-cart { justify-self: end; display: flex; gap: 20px; align-items: center; }
.pv-burger { display: inline-block; width: 22px; height: 10px; border-top: 1.5px solid; border-bottom: 1.5px solid; }
</style>
</head>
<body>
<div class="gh">
  <div class="gh-announce gh-mono">Free shipping on 2+ masks — 30-day returns</div>
  <header class="pv-head"><div class="gh-wrap pv-head__in">
    <div><span class="pv-burger" aria-hidden="true"></span><nav class="pv-nav gh-mono"><a href="#">Shop</a><a href="#">The crew</a><a href="#">FAQ</a></nav></div>
    <a class="pv-logo gh-display" href="#">Gnarhead</a>
    <div class="pv-cart gh-mono"><span class="pv-search">Search</span><span>Cart (0)</span></div>
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
