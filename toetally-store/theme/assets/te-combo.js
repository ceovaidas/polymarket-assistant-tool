/* toetally.extra: "Just the toes" or "Clogs + toes" on top of the shared bundle picker (kb.js).
   Step 1 switches the mode: toe bundles, or the combo card with a clog colour + size picker.
   kb.js prices every card as unit × quantity − discount; the combo also adds the clogs, so this script
   corrects that card and the button, and adds both products to the cart in one request. */
(function () {
  var root = document.querySelector('[data-kb]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var fmtP = function (cents) { return '$' + (Math.max(0, cents) / 100).toFixed(2); };

  /* Price row under the title: total, the real full price it comes from, and the gain badge */
  var fullEl = $('[data-te-full]'), saveEl = $('[data-te-save]'), noteEl = $('[data-te-note]');
  function priceRow() {
    var sel = $('.kb-tier input:checked');
    if (!sel) return;
    var vSel = $('[data-kb-variant]'), o = vSel && vSel.selectedOptions[0];
    var u = o && o.dataset.price ? +o.dataset.price : +root.dataset.unit || 0;
    var q = +sel.value, off = +sel.dataset.off || 0, extra = 0;
    if (sel.hasAttribute('data-te-combo')) {
      var hid = $('[data-te-addon-variant]'), js = $('[data-te-addon-json]'), vs = [];
      try { vs = JSON.parse(js ? js.textContent : '[]'); } catch (e) { vs = []; }
      var pick = hid && vs.find(function (v) { return String(v.id) === String(hid.value); });
      extra = pick ? +pick.price : +sel.dataset.addonPrice || 0;
    }
    var full = u * q + extra;
    if (fullEl) { fullEl.textContent = fmtP(full); fullEl.hidden = off <= 0; }
    if (saveEl) { saveEl.textContent = fmtP(off).replace('.00', '') + ' to spend'; saveEl.hidden = off <= 0; }
    if (noteEl && +noteEl.dataset.pack) {
      var toes = q * +noteEl.dataset.pack;
      noteEl.textContent = extra ? 'clogs + ' + toes + ' toes' : toes + ' toes';
    }
  }
  root.addEventListener('change', function () { setTimeout(priceRow, 0); });
  root.addEventListener('click', function (e) { if (e.target.closest('[data-te-mode]')) setTimeout(priceRow, 0); });
  priceRow();

  var combo = root.querySelector('[data-te-combo]');
  if (!combo) return;
  var form = $('[data-kb-form]') || combo.closest('form');
  var card = combo.closest('.kb-tier');
  var addon = $('[data-te-addon]');
  var addonId = $('[data-te-addon-variant]');
  var optSelects = $$('[data-te-addon-opt]');
  var variant = $('[data-kb-variant]');
  var legend = $('[data-te-legend]');
  var note = $('[data-te-addon-note]');
  var noteText = note ? note.textContent : '';
  var variants = [];
  try { variants = JSON.parse(($('[data-te-addon-json]') || {}).textContent || '[]'); } catch (e) { variants = []; }
  var fmt = fmtP;
  var lastToeTier = $('.kb-tier:not(.te-combo) input:checked') || $('.kb-tier:not(.te-combo) input');

  function unit() {
    var o = variant && variant.selectedOptions[0];
    return o && o.dataset.price ? +o.dataset.price : +root.dataset.unit || 0;
  }
  function chosenClog() {
    var picked = optSelects.map(function (s) { return s.value; });
    return variants.find(function (v) {
      return picked.every(function (val, i) { return (v.options || [v.option1, v.option2, v.option3])[i] === val; });
    });
  }
  function update() {
    var clog = chosenClog();
    if (clog && addonId) addonId.value = clog.id;
    var clogPrice = clog ? +clog.price : +combo.dataset.addonPrice || 0;
    var full = unit() * (+combo.value) + clogPrice, total = full - (+combo.dataset.off || 0);
    var price = card.querySelector('[data-kb-tier-price]'), was = card.querySelector('[data-kb-tier-full]');
    if (price) price.textContent = fmt(total);
    if (was) was.textContent = fmt(full);
    var soldOut = clog && clog.available === false;
    if (note) note.textContent = soldOut ? 'This size is sold out, please pick another one.' : noteText;
    var btn = $('[data-kb-submit]');
    if (btn) btn.disabled = combo.checked && soldOut;
    if (!combo.checked) return;
    $$('[data-kb-cta-price], [data-kb-sticky-price]').forEach(function (el) { el.textContent = fmt(total); });
  }

  /* Step 1: mode buttons */
  function setMode(mode) {
    var isCombo = mode === 'combo';
    root.classList.toggle('te-mode-combo', isCombo);
    $$('[data-te-mode]').forEach(function (b) {
      var on = b.dataset.teMode === mode;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (addon) addon.hidden = !isCombo;
    if (legend) legend.textContent = isCombo ? legend.dataset.combo : legend.dataset.toes;
    var target = isCombo ? combo : lastToeTier;
    if (target && !target.checked) {
      target.checked = true;
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    update();
  }
  $$('[data-te-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      setMode(b.dataset.teMode);
      if (b.classList.contains('te-value__go')) { var buy = document.getElementById('kb-buy'); if (buy) buy.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
  $$('.kb-tier:not(.te-combo) input').forEach(function (i) {
    i.addEventListener('change', function () { if (i.checked) lastToeTier = i; });
  });

  $$('.kb-tier input').forEach(function (i) { i.addEventListener('change', update); });
  if (variant) variant.addEventListener('change', update);
  optSelects.forEach(function (s) { s.addEventListener('change', update); });
  setMode(combo.checked ? 'combo' : 'toes');

  if (!form) return;
  form.addEventListener('submit', function (e) {
    if (!combo.checked || !addonId) return;
    e.preventDefault();
    var btn = form.querySelector('[data-kb-submit]');
    if (btn) btn.disabled = true;
    var toes = form.querySelector('[name="id"]');
    var base = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    fetch(base + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [
        { id: +toes.value, quantity: +combo.value },
        { id: +addonId.value, quantity: 1 }
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
