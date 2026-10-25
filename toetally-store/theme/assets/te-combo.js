/* toetally.extra: the "Clogs + toes" combo card on top of the shared bundle picker (kb.js).
   kb.js prices every card as unit × quantity − discount; the combo also adds the clogs, so this script
   corrects that card and the button, shows the clog picker only for the combo, and adds both products
   to the cart in one request. */
(function () {
  var root = document.querySelector('[data-kb]');
  var combo = root && root.querySelector('[data-te-combo]');
  if (!combo) return;
  var form = root.querySelector('[data-kb-form]') || combo.closest('form');
  var card = combo.closest('.kb-tier');
  var addon = root.querySelector('[data-te-addon]');
  var addonSelect = root.querySelector('[data-te-addon-variant]');
  var variant = root.querySelector('[data-kb-variant]');
  var fmt = function (cents) { return '$' + (Math.max(0, cents) / 100).toFixed(2); };

  function unit() {
    var o = variant && variant.selectedOptions[0];
    return o && o.dataset.price ? +o.dataset.price : +root.dataset.unit || 0;
  }
  function addonPrice() {
    var o = addonSelect && addonSelect.selectedOptions[0];
    return o && o.dataset.price ? +o.dataset.price : +combo.dataset.addonPrice || 0;
  }
  function update() {
    var full = unit() * (+combo.value) + addonPrice(), total = full - (+combo.dataset.off || 0);
    var price = card.querySelector('[data-kb-tier-price]'), was = card.querySelector('[data-kb-tier-full]');
    if (price) price.textContent = fmt(total);
    if (was) was.textContent = fmt(full);
    if (addon) addon.hidden = !combo.checked;
    if (!combo.checked) return;
    root.querySelectorAll('[data-kb-cta-price], [data-kb-sticky-price]').forEach(function (el) { el.textContent = fmt(total); });
  }
  root.querySelectorAll('.kb-tier input').forEach(function (i) { i.addEventListener('change', update); });
  if (variant) variant.addEventListener('change', update);
  if (addonSelect) addonSelect.addEventListener('change', update);
  update();

  if (!form) return;
  form.addEventListener('submit', function (e) {
    if (!combo.checked || !addonSelect) return;
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
        { id: +addonSelect.value, quantity: 1 }
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
