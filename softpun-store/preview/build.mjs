// Renders the Softpun sections with sample tees into preview/index.html, product.html and cart.html.
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
engine.registerFilter('placeholder_svg_tag', () => '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#eee"/></svg>');
engine.registerFilter('payment_type_svg_tag', () => '');
engine.registerFilter('json', (v) => JSON.stringify(v));
engine.registerTag('form', {
  parse(token, remain) { this.tpls = []; const s = this.liquid.parser.parseStream(remain).on('tag:endform', () => s.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form'); }); s.start(); },
  * render(ctx, em) { em.write('<form class="sp-form" onsubmit="event.preventDefault(); alert(\'Preview: in Shopify this adds the tee to the bag.\')">'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em); em.write('</form>'); },
});
engine.registerTag('schema', { parse(t, r) { const s = this.liquid.parser.parseStream(r).on('tag:endschema', () => s.stop()).on('end', () => {}); s.start(); }, render() {} });

// Sample tees drawn as SVG (the real store uses the product photos).
mkdirSync(join(here, 'img'), { recursive: true });
const tees = [
  ['Professional Yapper', ['PROFESSIONAL', 'YAPPER'], '#ff3d9a', '🗣️'],
  ['Chronically Online', ['CHRONICALLY', 'ONLINE'], '#3de0ff', '📱'],
  ['Silly Goose University', ['SILLY GOOSE', 'UNIVERSITY'], '#c8ff3d', '🪿'],
  ["It's Nap O'Clock", ["IT'S NAP", "O'CLOCK"], '#9b4dff', '😴'],
  ['Mentally At The Gym', ['MENTALLY', 'AT THE GYM'], '#ff8a3d', '🏋️'],
  ['Emotional Damage', ['EMOTIONAL', 'DAMAGE'], '#ff3d5a', '💥'],
  ['Main Character (Unpaid)', ['MAIN CHARACTER', '(UNPAID)'], '#3dffb0', '🎬'],
  ['Touch Grass? Never', ['TOUCH GRASS?', 'NEVER'], '#7dff3d', '🌱'],
];
const bgs = ['#efe6d6', '#f3e9d4', '#ece3d3', '#f1e7d8'];
function teeSvg(lines, glow, emoji, bg, back) {
  const id = Math.random().toString(36).slice(2, 7);
  const text = lines.map((l, i) => `<text x="200" y="${(back ? 196 : 186) + i * 34}" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="${l.length > 11 ? 22 : 30}" fill="url(#c${id})" stroke="#1d1530" stroke-width="1.5" paint-order="stroke">${l.replace(/&/g, '&amp;')}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="c${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#cfc8de"/><stop offset=".55" stop-color="#7d7394"/><stop offset=".7" stop-color="#f4f0ff"/><stop offset="1" stop-color="#a59cba"/></linearGradient><radialGradient id="m${id}"><stop offset="0" stop-color="#f4f0ff"/><stop offset=".6" stop-color="#b9b2c9"/><stop offset="1" stop-color="#5d566d"/></radialGradient><radialGradient id="g${id}"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="400" height="500" fill="${bg}"/><ellipse cx="200" cy="462" rx="140" ry="12" fill="rgba(27,22,18,.16)"/>`
    + `<path d="M140 70 L95 85 L40 140 L75 190 L110 165 L110 440 L290 440 L290 165 L325 190 L360 140 L305 85 L260 70 C250 95 225 108 200 108 C175 108 150 95 140 70 Z" fill="#141016" stroke="rgba(255,255,255,.12)" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M140 70 C150 95 175 108 200 108 C225 108 250 95 260 70" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="4"/>`
    + `<circle cx="200" cy="${back ? 300 : 290}" r="80" fill="url(#g${id})"/><circle cx="235" cy="${back ? 290 : 280}" r="38" fill="url(#m${id})" opacity=".9"/>`
    + `<path d="M140 340 q30 -20 60 0 t60 0" fill="none" stroke="rgba(230,225,240,.35)" stroke-width="10" stroke-linecap="round"/>`
    + `<text x="185" y="${back ? 318 : 308}" text-anchor="middle" font-size="52">${emoji}</text>`
    + text + (back ? `<text x="200" y="400" text-anchor="middle" font-family="Arial" font-weight="700" font-size="12" fill="rgba(27,22,18,.55)" letter-spacing="3">BACK PRINT</text>` : '') + `</svg>`;
}
const products = tees.map(([title, lines, glow, emoji], i) => {
  writeFileSync(join(here, 'img', `t${i}a.svg`), teeSvg(lines, glow, emoji, bgs[i % 4], false));
  writeFileSync(join(here, 'img', `t${i}b.svg`), teeSvg(lines, glow, emoji, '#e8dcc6', true));
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const variants = sizes.map((s, k) => ({ id: i * 10 + k + 1, title: s, options: [s], option1: s, price: 2999, compare_at_price: null, available: !(i === 0 && s === 'XXL') }));
  const media = [{ preview_image: { src: `img/t${i}a.svg` }, alt: title }, { preview_image: { src: `img/t${i}b.svg` }, alt: title + ' back' }];
  return {
    title, url: 'product.html', available: true, media, featured_media: media[0], variants,
    selected_or_first_available_variant: variants[1], options_with_values: [{ name: 'Size', values: sizes }],
    description: `<p><strong>For the friend who ${['sends 47 voice notes a day', 'has 9 hours of screen time and no regrets', 'honks first and thinks never', 'treats naps like a sport', 'skips leg day in real life too', 'speaks fluent meme', 'narrates their own life', 'has not seen sunlight since 2019'][i]}.</strong></p><p>Vintage bootleg-style graphic on a heavyweight black tee. Wear it, get screenshotted.</p><ul><li>Heavyweight cotton, relaxed unisex fit</li><li>Printed to order, front graphic</li><li>Sizes S–XXL</li></ul>`,
  };
});

function section(file, settings = {}, tplBlocks = {}, order = []) {
  const src = read(`sections/${file}`);
  const schema = JSON.parse(src.match(/{% schema %}([\s\S]*){% endschema %}/)[1]);
  const def = (list) => Object.fromEntries((list || []).filter((s) => s.id).map((s) => [s.id, s.default ?? null]));
  const blocks = order.map((id) => { const b = tplBlocks[id]; const d = (schema.blocks || []).find((x) => x.type === b.type) || {}; return { id, type: b.type, settings: { ...def(d.settings), ...b.settings }, shopify_attributes: '' }; });
  return { src, data: { id: file, settings: { ...def(schema.settings), ...settings }, blocks } };
}
const ctx = {
  shop: { name: 'Softpun', email: 'hello@softpun.com', policies: [{ title: 'Refund policy', url: '#' }, { title: 'Shipping policy', url: '#' }, { title: 'Privacy policy', url: '#' }], enabled_payment_types: [] },
  routes: { root_url: 'index.html', all_products_collection_url: 'index.html#sp-grid', cart_url: 'cart.html', account_url: '#', cart_change_url: '#', cart_add_url: '#' },
  cart: { item_count: 0 }, collections: { all: { products } },
};
const end = new Date(Date.now() + 2 * 864e5 + 5 * 36e5).toISOString().slice(0, 16);
const render = async (s, extra = {}) => engine.parseAndRender(s.src, { ...ctx, ...extra, section: s.data });
const head = section('sp-header.liquid', { countdown_end: end });
const foot = section('sp-footer.liquid');
const pop = section('sp-popup.liquid', { delay: 3 });
const home = (() => { const t = JSON.parse(read('templates/index.json')).sections.home; return section('sp-home.liquid', { image: { src: 'img/hero.svg' } }, t.blocks, t.block_order); })();
const pdp = section('sp-product.liquid');

// Hero art: three folded tees
writeFileSync(join(here, 'img', 'hero.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#8f86a6"/><stop offset=".65" stop-color="#f7f3ff"/><stop offset="1" stop-color="#b9b0cc"/></linearGradient><radialGradient id="hg"><stop offset="0" stop-color="#ff5a36" stop-opacity=".35"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient></defs><rect width="600" height="600" fill="#ffd43b"/><circle cx="300" cy="300" r="260" fill="url(#hg)"/><circle cx="470" cy="120" r="50" fill="#fff6d6"/>`
  + [['YAPPER', 150, 340, -9, '#ff5a36'], ['NAP O’CLOCK', 300, 260, 3, '#fff6d6'], ['ONLINE', 440, 380, 10, '#ff8fab']].map(([t, x, y, r, c]) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-110" y="-125" width="220" height="250" rx="24" fill="#141016" stroke="#1b1612" stroke-width="4"/><path d="M-50 -125 C-40 -100 40 -100 50 -125" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="4"/><circle cx="20" cy="20" r="46" fill="${c}" opacity=".25"/><text y="-30" text-anchor="middle" font-family="Arial Black, Impact" font-weight="900" font-size="${t.length > 8 ? 22 : 30}" fill="url(#hc)">${t}</text></g>`).join('') + `</svg>`);

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f6efe3}</style></head><body>${body}</body></html>`;
mkdirSync(join(here, 'assets'), { recursive: true });
for (const f of ['sp.css', 'sp.js']) copyFileSync(join(theme, 'assets', f), join(here, 'assets', f));
// Cart mock: two tees in the bag, stickers as add-ons under $10
const sticker = (t, e, id) => { writeFileSync(join(here, 'img', `s${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#fff1bf"/><text x="50" y="66" text-anchor="middle" font-size="48">${e}</text></svg>`); const m = { preview_image: { src: `img/s${id}.svg` } }; return { id: 900 + id, title: t, price: 499, available: true, featured_media: m, selected_or_first_available_variant: { id: 990 + id } }; };
const lines = [[products[0], 1, 2], [products[3], 1, 1]].map(([p, q, k]) => ({ product: { ...p, has_only_default_variant: false }, product_id: p.variants[0].id, variant: p.variants[k], quantity: q, url: 'product.html', image: p.media[0].preview_image, final_line_price: 2999 * q, original_line_price: 2999 * q, line_level_discount_allocations: [], url_to_remove: '#' }));
const cart = { item_count: 2, items: lines, total_price: 5998, cart_level_discount_applications: [] };
const cartSec = section('sp-cart.liquid', { addon_collection: { products: [sticker('Yapper sticker pack', '🗣️', 1), sticker('Silly Goose sticker', '🪿', 2), sticker('Nap O\'Clock sticker', '😴', 3)] } });
writeFileSync(join(here, 'cart.html'), page('Your bag · Softpun', [await render(head, { cart }), await render(cartSec, { cart }), await render(foot)].join('\n')));
writeFileSync(join(here, 'index.html'), page('Softpun', [await render(head), await render(home), await render(foot), await render(pop)].join('\n')));
writeFileSync(join(here, 'product.html'), page('Professional Yapper Tee · Softpun', [await render(head), await render(pdp, { product: products[0] }), await render(foot)].join('\n')));
console.log('wrote preview/index.html, product.html and cart.html');
