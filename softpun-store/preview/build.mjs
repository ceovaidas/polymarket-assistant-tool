// Renders the Softpun sections with sample tees into preview/index.html and preview/product.html.
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
  ['Nap Queen', ['NAP', 'QUEEN'], '#f4cd6a', '#3a2a21', '👑'],
  ['Pun Intended', ['PUN', 'INTENDED'], '#8aa58c', '#fffaf2', '😏'],
  ["Snack O'Clock", ['SNACK', "O'CLOCK"], '#d8643c', '#fffaf2', '🍕'],
  ['Introverted But Willing To Discuss Cats', ['INTROVERTED', 'BUT WILLING TO', 'DISCUSS CATS'], '#fffaf2', '#3a2a21', '🐈'],
  ['Running Late Is My Cardio', ['RUNNING LATE', 'IS MY CARDIO'], '#3a2a21', '#f4cd6a', '🏃'],
  ['Emotional Support Coffee', ['EMOTIONAL', 'SUPPORT', 'COFFEE'], '#c99a6b', '#fffaf2', '☕'],
  ['Professional Overthinker', ['PROFESSIONAL', 'OVERTHINKER'], '#e3ece0', '#3a2a21', '🤯'],
  ['Dad Joke Loading', ['DAD JOKE', 'LOADING…'], '#9db7d5', '#3a2a21', '⏳'],
];
const bgs = ['#f3e9da', '#efe3d1', '#f7eedf', '#ede4d6'];
function teeSvg(lines, color, ink, emoji, bg, back) {
  const text = lines.map((l, i) => `<text x="200" y="${(back ? 205 : 222) + i * 30 - (lines.length - 1) * 15}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${l.length > 11 ? 21 : 27}" fill="${ink}">${l.replace(/&/g, '&amp;')}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/><ellipse cx="200" cy="462" rx="140" ry="12" fill="rgba(58,42,33,.08)"/>`
    + `<path d="M140 70 L95 85 L40 140 L75 190 L110 165 L110 440 L290 440 L290 165 L325 190 L360 140 L305 85 L260 70 C250 95 225 108 200 108 C175 108 150 95 140 70 Z" fill="${color}" stroke="rgba(58,42,33,.25)" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M140 70 C150 95 175 108 200 108 C225 108 250 95 260 70" fill="none" stroke="rgba(58,42,33,.3)" stroke-width="4"/>`
    + (back ? `<text x="200" y="160" text-anchor="middle" font-size="40">${emoji}</text>${text}<text x="200" y="300" text-anchor="middle" font-family="Arial" font-size="13" fill="${ink}" opacity=".7">BACK PRINT</text>`
            : `${text}<text x="200" y="${300 + (lines.length - 1) * 8}" text-anchor="middle" font-size="44">${emoji}</text>`) + `</svg>`;
}
const products = tees.map(([title, lines, color, ink, emoji], i) => {
  writeFileSync(join(here, 'img', `t${i}a.svg`), teeSvg(lines, color, ink, emoji, bgs[i % 4], false));
  writeFileSync(join(here, 'img', `t${i}b.svg`), teeSvg(lines, color, ink, emoji, '#e7dac7', true));
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const variants = sizes.map((s, k) => ({ id: i * 10 + k + 1, title: s, options: [s], option1: s, price: 2999, compare_at_price: null, available: !(i === 0 && s === 'XXL') }));
  const media = [{ preview_image: { src: `img/t${i}a.svg` }, alt: title }, { preview_image: { src: `img/t${i}b.svg` }, alt: title + ' back' }];
  return {
    title, url: 'product.html', available: true, media, featured_media: media[0], variants,
    selected_or_first_available_variant: variants[1], options_with_values: [{ name: 'Size', values: sizes }],
    description: `<p><strong>For the friend who ${['has perfected the art of the afternoon nap', 'groans at every joke and secretly loves them', 'is always thinking about the next snack', 'would rather stay home with the cat', 'has never been on time, ever', 'is not a morning person', 'replays every conversation at 2am', 'is one joke away from becoming their dad'][i]}.</strong></p><p>A soft, relaxed tee with a print that does the talking.</p><ul><li>Soft ringspun cotton, unisex relaxed fit</li><li>Printed to order, front print</li><li>Sizes S–XXL</li></ul>`,
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
  routes: { root_url: 'index.html', all_products_collection_url: 'index.html#sp-grid', cart_url: '#', account_url: '#' },
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
writeFileSync(join(here, 'img', 'hero.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#e3ece0"/><circle cx="470" cy="130" r="70" fill="#f4cd6a" opacity=".6"/>`
  + [['#d8643c', 'PUN', 'INTENDED', 150, 330, -8], ['#f4cd6a', 'NAP', 'QUEEN', 300, 250, 4], ['#fffaf2', 'SNACK', "O'CLOCK", 420, 370, 10]].map(([c, a, b, x, y, r]) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-110" y="-120" width="220" height="240" rx="24" fill="${c}" stroke="rgba(58,42,33,.25)" stroke-width="3"/><path d="M-50 -120 C-40 -95 40 -95 50 -120" fill="none" stroke="rgba(58,42,33,.3)" stroke-width="4"/><text y="-10" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="30" fill="#3a2a21">${a}</text><text y="26" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${b.length > 7 ? 22 : 30}" fill="#3a2a21">${b.replace("'", '&apos;')}</text></g>`).join('') + `</svg>`);

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{margin:0;background:#f7f0e5}</style></head><body>${body}</body></html>`;
mkdirSync(join(here, 'assets'), { recursive: true });
for (const f of ['sp.css', 'sp.js']) copyFileSync(join(theme, 'assets', f), join(here, 'assets', f));
writeFileSync(join(here, 'index.html'), page('Softpun', [await render(head), await render(home), await render(foot), await render(pop)].join('\n')));
writeFileSync(join(here, 'product.html'), page('Nap Queen Tee · Softpun', [await render(head), await render(pdp, { product: products[0] }), await render(foot)].join('\n')));
console.log('wrote preview/index.html and preview/product.html');
