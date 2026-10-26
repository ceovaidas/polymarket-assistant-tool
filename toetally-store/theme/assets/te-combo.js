/* toetally.extra: price row + the optional "Add clogs" add-on on top of the shared bundle picker (kb.js).
   The toe bundles stay as they are. Ticking "Add clogs" shows colour, size and pairs; every pair is
   discounted when the cart holds enough toe packs (same rule as the automatic Buy X get Y discount).
   Both products go to the cart in one request. Never pre-ticked. */
(function () {
  var root = document.querySelector('[data-kb]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var fmt = function (c) { return '$' + (Math.max(0, c) / 100).toFixed(2); };

  var form = $('[data-kb-form]');
  var variant = $('[data-kb-variant]');
  var add = $('[data-te-add]');
  var addOn = $('[data-te-add-on]');
  var addOpts = $('[data-te-add-opts]');
  var addId = $('[data-te-addon-variant]');
  var addQty = $('[data-te-add-qty]');
  var addPrice = $('[data-te-add-price]');
  var addHint = $('[data-te-add-hint]');
  var addNote = $('[data-te-addon-note]');
  var noteText = addNote ? addNote.textContent : '';
  var optSelects = $$('[data-te-addon-opt]');
  var fullEl = $('[data-te-full]'), saveEl = $('[data-te-save]'), packNote = $('[data-te-note]');
  var variants = [];
  try { variants = JSON.parse(($('[data-te-addon-json]') || {}).textContent || '[]'); } catch (e) { variants = []; }
  var offPair = add ? +add.dataset.off || 0 : 0, minPacks = add ? +add.dataset.minPacks || 2 : 2;

  function unit() { var o = variant && variant.selectedOptions[0]; return o && o.dataset.price ? +o.dataset.price : +root.dataset.unit || 0; }
  function tier() { return $('.kb-tier input:checked') || $('.kb-tier input'); }
  function clog() {
    var picked = optSelects.map(function (s) { return s.value; });
    return variants.find(function (v) { return picked.every(function (val, i) { return (v.options || [v.option1, v.option2, v.option3])[i] === val; }); });
  }
  function pairs() { return Math.min(10, Math.max(1, parseInt(addQty && addQty.value, 10) || 1)); }

  function update() {
    var t = tier(); if (!t) return;
    var packs = +t.value, toeFull = unit() * packs, toeOff = +t.dataset.off || 0;
    var c = clog(), cPrice = c ? +c.price : 0, n = pairs();
    if (c && addId) addId.value = c.id;
    var discPairs = Math.min(n, Math.floor(packs / minPacks));
    var addFull = cPrice * n, addOff = offPair * discPairs;
    var on = !!(addOn && addOn.checked);
    var full = toeFull + (on ? addFull : 0), off = toeOff + (on ? addOff : 0), total = full - off;

    if (addPrice) addPrice.textContent = '+' + fmt(addFull - addOff);
    if (addHint) addHint.textContent = !offPair
      ? fmt(cPrice) + ' a pair, the perfect base for your toes'
      : discPairs > 0
      ? fmt(cPrice - offPair) + ' a pair with your toes (normally ' + fmt(cPrice) + ')'
      : fmt(cPrice) + ' a pair · ' + fmt(cPrice - offPair) + ' with ' + minPacks + '+ toe packs';
    if (addOpts) addOpts.hidden = !on;
    var soldOut = on && c && c.available === false;
    if (addNote) addNote.textContent = soldOut ? 'This size is sold out, please pick another one.' : noteText;
    var btn = $('[data-kb-submit]'); if (btn) btn.disabled = !!soldOut;

    $$('[data-kb-cta-price], [data-kb-sticky-price]').forEach(function (el) { el.textContent = fmt(total); });
    if (fullEl) { fullEl.textContent = fmt(full); fullEl.hidden = off <= 0; }
    if (saveEl) { saveEl.textContent = fmt(off).replace('.00', '') + ' to spend'; saveEl.hidden = off <= 0; }
    if (packNote && +packNote.dataset.pack) {
      var toes = packs * +packNote.dataset.pack;
      packNote.textContent = toes + ' toes' + (on ? ' + ' + n + (n > 1 ? ' pairs' : ' pair') + ' of clogs' : '');
    }
  }

  /* kb.js updates on the same events first; this runs after it and has the final word on totals */
  root.addEventListener('change', function () { setTimeout(update, 0); });
  $$('[data-te-qty]').forEach(function (b) {
    b.addEventListener('click', function () { addQty.value = Math.min(10, Math.max(1, pairs() + +b.dataset.teQty)); update(); });
  });
  if (addQty) addQty.addEventListener('input', function () { setTimeout(update, 0); });
  update();

  if (!form) return;
  form.addEventListener('submit', function (e) {
    if (!addOn || !addOn.checked || !addId) return;
    e.preventDefault();
    var btn = form.querySelector('[data-kb-submit]');
    if (btn) btn.disabled = true;
    var toes = form.querySelector('[name="id"]');
    var base = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    fetch(base + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [
        { id: +toes.value, quantity: +tier().value },
        { id: +addId.value, quantity: pairs() }
      ] })
    }).then(function (r) {
      if (!r.ok) throw new Error('cart');
      window.location.href = base + (root.dataset.teCheckout === 'true' ? 'checkout' : 'cart');
    }).catch(function () {
      if (btn) btn.disabled = false;
      alert('Sorry, that size is not available right now. Please pick another one.');
    });
  });
})();
