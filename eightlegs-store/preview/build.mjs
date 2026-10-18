// Renders the Eightlegs one-jacket store with an illustrated sample jacket: index.html and cart.html.
// Usage: cd preview && npm install liquidjs && node build.mjs
import { Liquid } from 'liquidjs';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
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
engine.registerFilter('image_tag', (src, ...a) => { const o = Object.fromEntries(a.filter(Array.isArray)); return `<img src="${src}" alt="${o.alt ?? ''}" loading="lazy">`; });
engine.registerFilter('video_tag', () => '');
engine.registerFilter('placeholder_svg_tag', () => '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#eee"/></svg>');
engine.registerFilter('payment_type_svg_tag', (t) => { const c = { visa: ['#1a1f71', '#fff', 'VISA'], master: ['#fff', '#eb001b', '●●'], paypal: ['#fff', '#003087', 'PayPal'], apple_pay: ['#fff', '#000', 'Pay'], klarna: ['#ffb3c7', '#000', 'Klarna'] }[t] || ['#ccc', '#000', t]; return `<svg viewBox="0 0 38 24"><rect width="38" height="24" rx="3" fill="${c[0]}"/><text x="19" y="16" text-anchor="middle" font-size="8" font-family="Arial" font-weight="700" fill="${c[1]}">${c[2]}</text></svg>`; });
engine.registerFilter('json', (v) => JSON.stringify(v));
engine.registerFilter('payment_terms', () => '<span>Pay in 4 interest-free installments of $7.49 with Shop Pay (preview)</span>');
engine.registerTag('paginate', {
  parse(token, remain) { this.tpls = []; const s = this.liquid.parser.parseStream(remain).on('tag:endpaginate', () => s.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate'); }); s.start(); },
  * render(ctx, em) { ctx.push({ paginate: { pages: 1 } }); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em); ctx.pop(); },
});
engine.registerTag('form', {
  parse(token, remain) { this.tpls = []; const s = this.liquid.parser.parseStream(remain).on('tag:endform', () => s.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form'); }); s.start(); },
  * render(ctx, em) { em.write('<form class="sp-form" data-sp-form action="#" method="post">'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em); em.write('</form>'); },
});
engine.registerTag('schema', { parse(t, r) { const s = this.liquid.parser.parseStream(r).on('tag:endschema', () => s.stop()).on('end', () => {}); s.start(); }, render() {} });

// The jacket is drawn as SVG for the preview; the real store shows the product photos.
mkdirSync(join(here, 'img'), { recursive: true });
const web = (cx, cy, r, op) => {
  let d = '';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d += `M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(0)} ${(cy + r * Math.sin(a)).toFixed(0)}`; }
  for (const k of [0.2, 0.4, 0.6, 0.8, 1]) {
    const pts = [...Array(13)].map((_, i) => [cx + r * k * Math.cos(i * Math.PI / 6), cy + r * k * Math.sin(i * Math.PI / 6)]);
    d += `M${pts[0][0].toFixed(0)} ${pts[0][1].toFixed(0)}`;
    for (let i = 1; i < 13; i++) { const m = [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2]; d += `Q${(cx + (m[0] - cx) * 0.86).toFixed(0)} ${(cy + (m[1] - cy) * 0.86).toFixed(0)} ${pts[i][0].toFixed(0)} ${pts[i][1].toFixed(0)}`; }
  }
  return `<path d="${d}" fill="none" stroke="#efece4" stroke-opacity="${op}" stroke-width="2" stroke-dasharray="6 5"/>`;
};
const body = `<path d="M150 90 L95 110 L55 210 L40 400 L70 430 L100 420 L105 250 L110 470 L290 470 L295 250 L300 420 L330 430 L360 400 L345 210 L305 110 L250 90 L200 120 Z" fill="#111" stroke="#2c2b28" stroke-width="3" stroke-linejoin="round"/><path d="M150 90 L200 120 L250 90 L238 70 L200 92 L162 70 Z" fill="#161616" stroke="#2c2b28" stroke-width="3"/><rect x="108" y="452" width="184" height="22" fill="#0b0b0b"/><rect x="38" y="398" width="34" height="34" fill="#0b0b0b"/><rect x="328" y="398" width="34" height="34" fill="#0b0b0b"/>`;
const spider = `<g fill="#efece4"><path d="M200 150 L188 205 L200 280 L212 205 Z"/><path d="M196 170 L130 140 L80 200 L95 205 L132 160 L190 190 Z"/><path d="M204 170 L270 140 L320 200 L305 205 L268 160 L210 190 Z"/><path d="M192 195 L140 190 L110 240 L124 244 L146 205 L190 212 Z"/><path d="M208 195 L260 190 L290 240 L276 244 L254 205 L210 212 Z"/><path d="M95 205 L60 380 L74 384 L108 215 Z"/><path d="M305 205 L340 380 L326 384 L292 215 Z"/></g>`;
const zip = `<path d="M200 120 V470" stroke="#8d8a83" stroke-width="4"/>`;
const frame = (inner, bg = '#141413') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/>${inner}</svg>`;
const shots = [
  frame(`<g transform="translate(0 0)">${body}${web(200, 300, 210, 0.35)}${spider}${zip}</g>`),
  frame(`${body}${web(200, 130, 340, 0.55)}<text x="200" y="128" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="20" fill="#efece4" opacity=".85">sf</text>`, '#191917'),
  frame(`<g transform="translate(200 250) scale(1.9) translate(-200 -200)">${body}${web(200, 300, 210, 0.45)}${spider}${zip}</g>`, '#0f0f0e'),
  frame(`<g transform="rotate(-8 200 250)">${body}${web(200, 300, 210, 0.35)}${spider}${zip}</g>`, '#2a2a28'),
];
shots.push(shots[2], shots[1], shots[3]); // 7 photos, like the real product
shots.forEach((svg, i) => writeFileSync(join(here, 'img', `j${i}.svg`), svg));
const media = shots.map((_, i) => ({ id: i + 1, media_type: 'image', preview_image: { src: `img/j${i}.svg` }, alt: 'Spider Web Faux-Leather Jacket' }));
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const variants = sizes.map((s, k) => ({ id: k + 1, title: `Black / White / ${s}`, options: ['Black / White', s], price: 8999, compare_at_price: null, available: true, featured_media: null }));
const jacket = {
  id: 1, title: 'Spider Web Faux-Leather Jacket', url: 'index.html', available: true, media, featured_media: media[0], variants,
  selected_or_first_available_variant: variants[1], options_with_values: [{ name: 'Color', values: ['Black / White'] }, { name: 'Size', values: sizes }],
  description: '<p><strong>For the one who walks in and the whole room looks twice.</strong></p><p>A boxy faux-leather bomber with a white spider spread across the chest and sleeves, and a full spider web stitched across the back. Throw it over a hoodie or a plain tee and that\'s the whole outfit.</p><ul><li>Material: 100% heavy faux leather (PU), polyester lining</li><li>Pockets: 2 front + 1 inside</li><li>Fit: boxy and oversized, unisex</li><li>Sizes: S–XXL</li><li>Tracked delivery, usually 7–17 business days</li></ul>',
};

function section(file, settings = {}, tplBlocks = {}, order = []) {
  const src = read(`sections/${file}`);
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  const def = (list) => Object.fromEntries((list || []).filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
  const blocks = order.map((id) => { const b = tplBlocks[id]; const d = (schema.blocks || []).find((x) => x.type === b.type) || {}; return { id, type: b.type, settings: { ...def(d.settings), ...b.settings }, shopify_attributes: '' }; });
  return { src, data: { id: file, settings: { ...def(schema.settings), ...settings }, blocks } };
}
const fromTpl = (key, file) => { const t = JSON.parse(read('templates/index.json')).sections[key]; return section(file, {}, t.blocks || {}, t.block_order || []); };
const ctx = {
  shop: { name: 'Eightlegs', email: 'hello@eightlegs.com', policies: [{ title: 'Refund policy', url: '#' }, { title: 'Shipping policy', url: '#' }, { title: 'Privacy policy', url: '#' }], enabled_payment_types: ['visa', 'master', 'paypal', 'apple_pay', 'klarna'] },
  routes: { root_url: 'index.html', all_products_collection_url: 'index.html', search_url: '#', cart_url: 'cart.html', account_url: '#', cart_change_url: '#', cart_add_url: '#' },
  cart: { item_count: 0 }, collections: { all: { products: [jacket] } }, template: { name: 'index' },
};
const render = async (s, extra = {}) => engine.parseAndRender(s.src, { ...ctx, ...extra, section: s.data });
const head = section('sp-header.liquid');
const foot = section('sp-footer.liquid');
const pop = section('sp-popup.liquid', { delay: 3 });
const pdp = section('sp-product.liquid');
const details = fromTpl('details', 'sp-details.liquid');
const faq = fromTpl('faq', 'sp-faq.liquid');
const gallery = fromTpl('gallery', 'sp-gallery.liquid');

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="icon" href="assets/eightlegs-favicon-32.png"><style>body{margin:0;background:#070707}</style></head><body>${body}</body></html>`;
mkdirSync(join(here, 'assets'), { recursive: true });
for (const f of ['sp.css', 'sp.js', 'eightlegs-wordmark.webp', 'eightlegs-favicon-32.png', 'eightlegs-bag-pair.webp', 'eightlegs-bag-bed.webp']) copyFileSync(join(theme, 'assets', f), join(here, 'assets', f));
writeFileSync(join(here, 'index.html'), page('Eightlegs · Spider Web Faux-Leather Jacket', [await render(head), await render(pdp), await render(details), await render(gallery), await render(faq), await render(foot), await render(pop)].join('\n')));

// Cart mock: one jacket in the bag, so the 2-jacket nudge shows
const line = { product: { ...jacket, has_only_default_variant: false }, product_id: 1, variant: variants[2], quantity: 1, url: 'index.html', image: media[0].preview_image, final_line_price: 8999, original_line_price: 8999, original_price: 8999, line_level_discount_allocations: [], url_to_remove: '#' };
const cart = { item_count: 1, items: [line], total_price: 8999, items_subtotal_price: 8999, total_discount: 0, cart_level_discount_applications: [] };
writeFileSync(join(here, 'cart.html'), page('Your bag · Eightlegs', [await render(head, { cart }), await render(section('sp-cart.liquid'), { cart }), await render(foot)].join('\n')));
console.log('wrote preview/index.html and cart.html');
