// Renders the real Shopify sections with mock store data into static preview pages.
// Usage: cd preview && npm install && npm run build  ->  preview/index.html (home) + preview/product.html
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const theme = join(here, '..', 'theme');
const read = (p) => readFileSync(join(theme, p), 'utf8');
const css = read('assets/jolly.css');
const js = read('assets/jolly.js');

// ---- engine with Shopify shims ----
const engine = new Liquid({ root: [join(theme, 'snippets')], extname: '.liquid' });
const noop = () => '';
engine.registerFilter('money', (c) => '$' + (Number(c) / 100).toFixed(2));
['asset_url', 'stylesheet_tag', 'image_url', 'image_tag', 'video_tag', 'media_tag', 'payment_terms'].forEach((f) => engine.registerFilter(f, noop));
engine.registerTag('form', {
  parse(token, remain) {
    this.isCustomer = token.args.includes("'customer'");
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain)
      .on('tag:endform', () => stream.stop())
      .on('template', (t) => this.tpls.push(t))
      .on('end', () => { throw new Error('form not closed'); });
    stream.start();
  },
  * render(ctx, emitter) {
    emitter.write(this.isCustomer
      ? '<form class="jh-news__form" onsubmit="event.preventDefault(); alert(\'Preview only — in Shopify this subscribes the email.\')">'
      : '<form method="post" action="/cart/add" data-jh-form="true" onsubmit="event.preventDefault(); alert(\'Preview only — in Shopify this adds to cart.\')">');
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
  },
});
engine.registerTag('schema', {
  parse(token, remain) {
    const stream = this.liquid.parser.parseStream(remain).on('tag:endschema', () => stream.stop()).on('end', () => {});
    stream.start();
  },
  render() {},
});

// ---- section settings + blocks (schema defaults, overridden by the template) ----
function sectionData(file, templateFile, key) {
  const src = read(`sections/${file}`).replace(/posted_successfully\?/g, 'posted_successfully');
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  const tpl = JSON.parse(read(`templates/${templateFile}`)).sections[key];
  const defaults = (list) => Object.fromEntries(list.filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
  const blocks = tpl.block_order.map((id) => {
    const b = tpl.blocks[id];
    const def = schema.blocks.find((d) => d.type === b.type);
    return { id, type: b.type, shopify_attributes: '', settings: { ...defaults(def.settings), ...b.settings } };
  });
  return { src, section: { id: key, settings: { ...defaults(schema.settings), ...tpl.settings }, blocks } };
}

// ---- mock catalogue (no photos yet → illustrations render) ----
const noReviews = { reviews: { rating: { value: null }, rating_count: null } };
const mk = (title, price, tags, url = '#', extra = {}) => {
  const v = { id: Math.floor(Math.random() * 1e6), title: 'Default Title', options: ['Default Title'], price, compare_at_price: 0, available: true, featured_media: null };
  return { title, url, price, compare_at_price: 0, price_varies: false, tags, available: true, has_only_default_variant: true,
    featured_media: null, media: [], variants: [v], selected_or_first_available_variant: v, metafields: noReviews, ...extra };
};
const faces = ['Gramps', 'The Cat', 'Tiger', 'Corgi', 'The Elf'];
const maskVariants = faces.map((f, i) => ({ id: 1000 + i, title: f, options: [f], price: 3999, compare_at_price: 0, available: true, featured_media: null }));
const mask = mk('Funny Face Ski Mask', 3999, ['viral', 'art-gramps'], 'product.html', {
  has_only_default_variant: false,
  options_with_values: [{ name: 'Face', values: faces, selected_value: faces[0] }],
  variants: maskVariants,
  selected_or_first_available_variant: maskVariants[0],
  description: '<p>Every ski trip has <em>that</em> photo. This is how you end up in it.</p><ul><li>Double-layer knit, fleece-lined face</li><li>Wide, goggle-ready eye port</li><li>Breathable mouth zone</li><li>Fits under most helmets</li><li>Ships in a drawstring pouch</li></ul>',
});
const catalogue = [
  mask,
  mk('Snowfall Star Projector', 4999, ['viral', 'art-projector']),
  mk('Baby Reindeer Onesie', 2999, ['new', 'art-onesie']),
  mk('“Sleigh Queen” Ugly Sweater', 4499, ['art-sweater']),
  mk('Elf Ski Mask', 3999, ['new', 'art-elf'], 'product.html'),
  mk('Light-Up Ornament Set (6)', 2499, ['art-ornament']),
  mk('Mystery Stocking Stuffer Box', 1999, ['viral', 'art-gift']),
  mk('Warm-White Curtain Lights', 3499, ['art-lights']),
];
const shop = { money_format: '${{amount}}', name: 'Jolly Haul' };

// ---- shared page shell (stand-in for the theme header + footer, which Dawn renders) ----
const logo = '<a class="pv-logo" href="index.html">jolly<b>haul</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.4 6.4 19.7l1.5-6.3L3 9.1l6.4-.6z" fill="#f2b33d"/></svg></a>';
const shell = (title, body) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Design preview of the Jolly Haul Shopify store, rendered from the real theme sections.">
<style>
${css}
/* preview-only stand-ins for the theme header and footer */
body { margin: 0; background: #fff; }
.pv-head { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid var(--line); }
.pv-head__in { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 66px; }
.pv-nav { display: none; gap: 26px; font-weight: 600; font-size: 15px; }
.pv-nav a { text-decoration: none; }
@media (min-width: 990px) { .pv-nav { display: flex; } .pv-burger { display: none !important; } }
.pv-logo { display: inline-flex; align-items: flex-start; gap: 2px; font-weight: 900; font-size: 28px; letter-spacing: -.045em; text-decoration: none; }
.pv-logo b { color: var(--pop); font-weight: 900; }
.pv-logo svg { width: 16px; height: 16px; margin-top: -2px; }
.pv-icons { justify-self: end; display: flex; gap: 18px; }
.pv-icons svg { width: 24px; height: 24px; }
.pv-burger { display: inline-block; width: 24px; height: 12px; border-top: 2.5px solid; border-bottom: 2.5px solid; border-radius: 1px; }
.pv-foot { background: var(--navy); color: rgba(255,255,255,.75); padding: 48px 0; font-size: 14px; }
.pv-foot__in { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px; align-items: center; }
.pv-foot .pv-logo { color: #fff; font-size: 24px; }
.pv-foot nav { display: flex; flex-wrap: wrap; gap: 20px; }
.pv-foot a { color: inherit; text-decoration: none; }
</style>
</head>
<body>
<div class="jh">
  <header class="pv-head"><div class="jh-wrap pv-head__in">
    <div><span class="pv-burger" aria-hidden="true"></span><nav class="pv-nav"><a href="index.html">Home</a><a href="#">Shop all</a><a href="product.html">Funny masks</a><a href="#">Gift finder</a></nav></div>
    ${logo}
    <div class="pv-icons" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0"/></svg>
    </div>
  </div></header>
</div>
${body.replace(/<script src="[^"]*" defer><\/script>/, '')}
<div class="jh"><footer class="pv-foot"><div class="jh-wrap pv-foot__in">
  ${logo}
  <nav><a href="#">Shipping</a><a href="#">Returns</a><a href="#">Contact</a><a href="#">Privacy</a></nav>
  <span>© 2026 Jolly Haul</span>
</div></footer></div>
<script>
${js}
</script>
</body>
</html>
`;

// ---- home ----
const home = sectionData('jolly-home.liquid', 'index.json', 'home');
home.section.settings.trending_collection = { url: '#', products: catalogue };
home.section.settings.spotlight_product = mask;
home.section.settings.hero_cta_link = '#';
const homeHtml = await engine.parseAndRender(home.src, { section: home.section, shop, request: {}, routes: { all_products_collection_url: '#' } });
writeFileSync(join(here, 'index.html'), shell('Jolly Haul Preview', homeHtml));

// ---- product ----
const prod = sectionData('jolly-product.liquid', 'product.landing.json', 'main');
const prodHtml = await engine.parseAndRender(prod.src, { product: mask, section: prod.section, shop, request: {} });
writeFileSync(join(here, 'product.html'), shell('Jolly Haul Product Preview', prodHtml));

console.log('wrote preview/index.html + preview/product.html');
