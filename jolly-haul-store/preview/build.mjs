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
// Optional: emulate the live store by loading Dawn's global CSS first (DAWN_DIR=/path/to/dawn npm run build).
const dawnDir = process.env.DAWN_DIR;
const dawnCss = dawnDir ? readFileSync(join(dawnDir, 'assets', 'base.css'), 'utf8') : '';
const dawnVars = dawnDir ? `:root { --font-body-family: Assistant, sans-serif; --font-body-style: normal; --font-body-weight: 400; --font-heading-family: Assistant, sans-serif; --font-heading-style: normal; --font-heading-weight: 400; --font-body-scale: 1; --font-heading-scale: 1; --color-foreground: 27,36,32; --color-background: 255,255,255; --page-width: 124rem; --spacing-sections-desktop: 0px; --spacing-sections-mobile: 0px; --grid-desktop-horizontal-spacing: 8px; --grid-mobile-horizontal-spacing: 4px; --buttons-radius: 14px; --inputs-radius: 12px; }` : '';
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
engine.registerTag('paginate', {
  parse(token, remain) {
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate not closed'); });
    stream.start();
  },
  * render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1, parts: [] } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
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
  const src = read(`sections/${file}`).replace(/posted_successfully\?/g, 'posted_successfully').replace(/recommendations\.performed\?/g, 'recommendations.performed');
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  const tpl = JSON.parse(read(`templates/${templateFile}`)).sections[key];
  const defaults = (list) => Object.fromEntries(list.filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
  const blocks = (tpl.block_order || []).map((id) => {
    const b = tpl.blocks[id];
    const def = (schema.blocks || []).find((d) => d.type === b.type);
    return { id, type: b.type, shopify_attributes: '', settings: { ...defaults(def.settings), ...b.settings } };
  });
  return { src, section: { id: key, settings: { ...defaults(schema.settings), ...(tpl.settings || {}) }, blocks } };
}

// ---- mock catalogue (no photos yet → illustrations render) ----
const noReviews = { reviews: { rating: { value: null }, rating_count: null } };
let pid = 1;
const mk = (title, price, tags, url = '#', extra = {}) => {
  const v = { id: Math.floor(Math.random() * 1e6), title: 'Default Title', options: ['Default Title'], price, compare_at_price: 0, available: true, featured_media: null };
  return { id: pid++, title, url, price, compare_at_price: 0, price_varies: false, tags, available: true, has_only_default_variant: true,
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
  mk('Snowfall Star Projector', 4999, ['viral', 'art-projector'], 'projector.html', { description: '<p>Turns any ceiling into a starry Christmas sky in seconds. Quiet, USB-powered, with a sleep timer.</p>' }),
  mk('Baby Reindeer Onesie', 2999, ['new', 'art-onesie']),
  mk('“Sleigh Queen” Ugly Sweater', 4499, ['art-sweater']),
  mk('Elf Ski Mask', 3999, ['new', 'art-elf'], 'product.html'),
  mk('Light-Up Ornament Set (6)', 2499, ['art-ornament']),
  mk('Mystery Stocking Stuffer Box', 1999, ['viral', 'art-gift']),
  mk('Warm-White Curtain Lights', 3499, ['art-lights']),
];
const mockColl = (handle, title, products) => ({ handle, title, url: 'collection.html', products, products_count: products.length });
const mockCollections = {
  all: mockColl('all', 'Products', catalogue),
  trending: mockColl('trending', 'Bestsellers', catalogue),
  'funny-masks': mockColl('funny-masks', 'Funny masks', catalogue.filter((p) => p.title.toLowerCase().includes('mask'))),
  'star-projectors': mockColl('star-projectors', 'Star projectors', catalogue.slice(1, 2)),
  'baby-kids': mockColl('baby-kids', 'Baby & kids', catalogue.slice(2, 3)),
  'ugly-sweaters': mockColl('ugly-sweaters', 'Ugly sweaters', []),
  'lights-decor': mockColl('lights-decor', 'Lights & decor', catalogue.slice(4, 5)),
  'stocking-stuffers': mockColl('stocking-stuffers', 'Stocking stuffers', catalogue.slice(5, 7)),
};
const shop = { money_format: '${{amount}}', name: 'Jolly Haul' };

// ---- shared page shell (stand-in for the theme header + footer, which Dawn renders) ----
const logo = '<a class="pv-logo" href="index.html">jolly<b>haul</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.4 6.4 19.7l1.5-6.3L3 9.1l6.4-.6z" fill="#f2b33d"/></svg></a>';
const shell = (title, body, header) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Design preview of the Jolly Haul Shopify store, rendered from the real theme sections.">
<style>
${(css.match(/@import url\([^)]*\);/) || [''])[0]}
${dawnVars}
${dawnCss}
${css.replace(/@import url\([^)]*\);/, '')}
/* preview-only stand-in for the theme footer */
.pv-logo { display: inline-flex; align-items: flex-start; gap: 2px; font-weight: 900; font-size: 28px; letter-spacing: -.045em; text-decoration: none; }
.pv-logo b { color: var(--pop); font-weight: 900; }
.pv-logo svg { width: 16px; height: 16px; margin-top: -2px; }
body { margin: 0; background: #fff; }
.pv-foot { background: var(--navy); color: rgba(255,255,255,.75); padding: 48px 0; font-size: 14px; }
.pv-foot__in { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 24px; align-items: center; }
.pv-foot .pv-logo { color: #fff; font-size: 24px; }
.pv-foot nav { display: flex; flex-wrap: wrap; gap: 20px; }
.pv-foot a { color: inherit; text-decoration: none; }
</style>
</head>
<body>
<div class="jh-header-wrapper">${header}</div>
${body.replace(/<script src="[^"]*" defer><\/script>/, '')}
${wheelHtml.replace(/<script src="[^"]*" defer><\/script>/, '')}
${footerHtml}
<script>
${js}
</script>
</body>
</html>
`;

// ---- prize wheel (real section, footer group) ----
const wheelSrc = read('sections/jolly-wheel.liquid').replace(/posted_successfully\?/g, 'posted_successfully');
const wheelSchema = JSON.parse(wheelSrc.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
const wheelCfg = JSON.parse(readFileSync(join(here, '..', 'theme-config', 'footer-wheel.json'), 'utf8'));
const wDefaults = (list) => Object.fromEntries(list.filter((x) => x.id).map((x) => [x.id, x.default ?? null]));
const wheelHtml = await engine.parseAndRender(wheelSrc, {
  section: {
    id: 'wheel',
    settings: { ...wDefaults(wheelSchema.settings), ...wheelCfg.settings, delay: 4 },
    blocks: wheelCfg.block_order.map((id) => ({ id, type: 'prize', shopify_attributes: '', settings: { ...wDefaults(wheelSchema.blocks[0].settings), ...wheelCfg.blocks[id].settings } })),
  },
});

// ---- footer (real section) ----
const footerSrc = read('sections/jolly-footer.liquid');
const footerSchema = JSON.parse(footerSrc.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
const footerHtml = await engine.parseAndRender(footerSrc, {
  section: { id: 'footer', settings: { ...Object.fromEntries(footerSchema.settings.filter((x) => x.id).map((x) => [x.id, x.default ?? null])), help_menu: 'footer', tiktok: '#', instagram: '#' } },
  shop: { ...shop, enabled_payment_types: [], policies: [{ title: 'Refund policy', url: '#' }, { title: 'Privacy policy', url: '#' }, { title: 'Terms of service', url: '#' }, { title: 'Shipping policy', url: '#' }] },
  collections: mockCollections,
  routes: { root_url: 'index.html', all_products_collection_url: 'collection.html' },
  linklists: { footer: { links: ['Search', 'Shipping', 'Returns', 'Privacy', 'Contact'].map((title) => ({ title, url: '#' })) } },
});

// ---- header (real section) ----
const headerSrc = read('sections/jolly-header.liquid');
const headerSchema = JSON.parse(headerSrc.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
const headerSettings = Object.fromEntries(headerSchema.settings.filter((x) => x.id).map((x) => [x.id, x.default ?? null]));
const renderHeader = (active) => engine.parseAndRender(headerSrc, {
  section: { id: 'header', settings: headerSettings },
  shop: { ...shop, customer_accounts_enabled: true },
  cart: { item_count: 2 },
  routes: { root_url: 'index.html', search_url: '#', cart_url: '#', account_url: '#' },
  linklists: { 'main-menu': { links: [
    { title: 'Home', url: 'index.html', active: active === 'home' },
    { title: 'All gifts', url: 'collection.html', active: active === 'shop' },
    { title: 'Bestsellers', url: 'collection.html', active: false },
    { title: 'Contact', url: '#', active: false },
  ] } },
});

// ---- home ----
const home = sectionData('jolly-home.liquid', 'index.json', 'home');
home.section.settings.trending_collection = { url: '#', products: catalogue };
home.section.settings.spotlight_product = mask;
home.section.settings.hero_cta_link = 'collection.html';
home.section.settings.trending_collection.url = 'collection.html';
// build_theme.py prepends an "All gifts" tile; mirror it here.
home.section.blocks.unshift({ id: 'cat_all', type: 'category', shopify_attributes: '', settings: { ...home.section.blocks.find((b) => b.type === 'category').settings, title: 'All gifts', art: 'gift', link: 'collection.html' } });
const homeHtml = await engine.parseAndRender(home.src, { section: home.section, shop, request: {}, collections: mockCollections, routes: { all_products_collection_url: 'collection.html' } });
writeFileSync(join(here, 'index.html'), shell('Jolly Haul Preview', homeHtml, await renderHeader('home')));

// ---- recommendations (real section; fallback collection = Bestsellers) ----
const relatedFor = async (templateFile, ctx) => {
  const rel = sectionData('jolly-related.liquid', templateFile, 'related');
  rel.section.settings.fallback = 'trending';
  return engine.parseAndRender(rel.src, { section: rel.section, shop, collections: mockCollections, recommendations: { performed: false, products_count: 0 },
    routes: { product_recommendations_url: '#', all_products_collection_url: 'collection.html', root_url: 'index.html' }, cart: { item_count: 0, items: [] }, ...ctx });
};
const pRoutes = { root_url: 'index.html', all_products_collection_url: 'collection.html', cart_url: '/cart', cart_add_url: '/cart/add' };

// ---- product ----
const prod = sectionData('jolly-product.liquid', 'product.landing.json', 'main');
const prodHtml = await engine.parseAndRender(prod.src, { product: mask, section: prod.section, shop, request: {}, routes: pRoutes, collection: mockCollections['funny-masks'] });
writeFileSync(join(here, 'product.html'), shell('Jolly Haul Product Preview', prodHtml + await relatedFor('product.landing.json', { product: mask }), await renderHeader('product')));

// ---- generic product (default product.json template) ----
const gen = sectionData('jolly-product.liquid', 'product.json', 'main');
const projector = catalogue[1];
const genHtml = await engine.parseAndRender(gen.src, { product: projector, section: gen.section, shop, request: {}, routes: pRoutes });
writeFileSync(join(here, 'projector.html'), shell('Jolly Haul Projector Preview', genHtml + await relatedFor('product.json', { product: projector }), await renderHeader('other')));

// ---- collection (Shop all) ----
const coll = sectionData('jolly-collection.liquid', 'collection.json', 'main');
const collHtml = await engine.parseAndRender(coll.src, {
  section: coll.section, shop, collections: mockCollections, routes: { all_products_collection_url: 'collection.html', root_url: 'index.html' },
  collection: { handle: 'all', title: 'Products', description: '<p>Every viral Christmas find, in one place.</p>', products: catalogue, products_count: catalogue.length, filters: [],
    sort_by: 'best-selling', sort_options: [{ value: 'best-selling', name: 'Best selling' }, { value: 'price-ascending', name: 'Price, low to high' }, { value: 'price-descending', name: 'Price, high to low' }, { value: 'created-descending', name: 'Newest' }] },
});
writeFileSync(join(here, 'collection.html'), shell('Jolly Haul Shop All Preview', collHtml, await renderHeader('shop')));

// ---- cart ----
const cartData = sectionData('jolly-cart.liquid', 'cart.json', 'main');
const line = (prod, v, qty, i) => ({ index: i + 1, quantity: qty, url: prod.url, product: prod, variant: v, image: null, properties: {}, line_level_discount_allocations: [],
  original_line_price: v.price * qty, final_line_price: v.price * qty, url_to_remove: '#' });
const lines = [line(mask, mask.variants[2], 2, 0), line(catalogue[1], catalogue[1].variants[0], 1, 1)];
const cartTotal = lines.reduce((a, l) => a + l.final_line_price, 0);
const cartHtml = await engine.parseAndRender(cartData.src, {
  section: cartData.section, shop, routes: { cart_url: '#', all_products_collection_url: 'collection.html' },
  cart: { item_count: 3, items: lines, total_price: cartTotal, items_subtotal_price: cartTotal, cart_level_discount_applications: [], note: '' },
});
const cartCtx = { item_count: 3, items: lines.map((l) => ({ ...l, product_id: l.product.id })) };
writeFileSync(join(here, 'cart.html'), shell('Jolly Haul Cart Preview', cartHtml + await relatedFor('cart.json', { cart: cartCtx }), await renderHeader('cart')));

console.log('wrote preview/index.html, product.html, projector.html, collection.html, cart.html');
