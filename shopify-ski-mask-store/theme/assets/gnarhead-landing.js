/* GNARHEAD landing — variant picker, bundle selector, gallery, sticky add-to-cart.
   Works with the gnarhead-product-landing section. No dependencies. */
(function () {
  'use strict';

  function money(cents, format) {
    var value = (cents / 100).toFixed(2);
    var noDecimals = Math.round(cents / 100).toString();
    if (!format) return '$' + value;
    return format
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, noDecimals)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','))
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function init(root) {
    var dataEl = root.querySelector('[data-gh-json]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var variants = data.variants || [];
    var form = root.querySelector('[data-gh-form]');
    var idInput = root.querySelector('[data-gh-variant-id]');
    var qtyInput = root.querySelector('[data-gh-qty]');
    var atcButtons = root.querySelectorAll('[data-gh-atc]');
    var priceNow = root.querySelectorAll('[data-gh-price]');
    var priceWas = root.querySelector('[data-gh-compare]');
    var saveBadge = root.querySelector('[data-gh-save]');
    var optionLabels = root.querySelectorAll('[data-gh-option-value]');
    var mainMedia = root.querySelector('[data-gh-main]');
    var thumbs = root.querySelectorAll('[data-gh-thumb]');

    function selectedOptions() {
      var values = [];
      root.querySelectorAll('[data-gh-option]').forEach(function (fieldset) {
        var checked = fieldset.querySelector('input:checked');
        values.push(checked ? checked.value : null);
      });
      return values;
    }

    function findVariant(values) {
      return variants.find(function (v) {
        return v.options.every(function (opt, i) { return opt === values[i]; });
      });
    }

    function currentBundle() {
      var checked = root.querySelector('[data-gh-bundle] input:checked');
      if (!checked) return { qty: 1, pct: 0 };
      return { qty: parseInt(checked.value, 10) || 1, pct: parseFloat(checked.dataset.pct) || 0 };
    }

    function showMedia(src, alt) {
      if (!mainMedia || !src) return;
      var img = mainMedia.querySelector('img');
      if (!img) {
        mainMedia.innerHTML = '';
        img = document.createElement('img');
        mainMedia.appendChild(img);
      }
      img.src = src;
      img.alt = alt || '';
      thumbs.forEach(function (t) { t.setAttribute('aria-current', t.dataset.src === src ? 'true' : 'false'); });
    }

    function render() {
      var variant = findVariant(selectedOptions());
      var bundle = currentBundle();

      optionLabels.forEach(function (el) {
        el.textContent = selectedOptions()[parseInt(el.dataset.ghOptionValue, 10)] || '';
      });

      if (!variant) {
        atcButtons.forEach(function (b) { b.disabled = true; b.textContent = data.strings.unavailable; });
        return;
      }

      idInput.value = variant.id;
      qtyInput.value = bundle.qty;

      // Bundle cards show their own totals for the selected variant.
      root.querySelectorAll('[data-gh-bundle] input').forEach(function (input) {
        var qty = parseInt(input.value, 10) || 1;
        var pct = parseFloat(input.dataset.pct) || 0;
        var full = variant.price * qty;
        var total = Math.round(full * (1 - pct / 100));
        var label = input.nextElementSibling;
        var nowEl = label.querySelector('[data-gh-bundle-now]');
        var wasEl = label.querySelector('[data-gh-bundle-was]');
        if (nowEl) nowEl.textContent = money(total, data.moneyFormat);
        if (wasEl) {
          var compareBase = (variant.compare_at_price && variant.compare_at_price > variant.price ? variant.compare_at_price : variant.price) * qty;
          wasEl.textContent = compareBase > total ? money(compareBase, data.moneyFormat) : '';
        }
      });

      var total = Math.round(variant.price * bundle.qty * (1 - bundle.pct / 100));
      priceNow.forEach(function (el) { el.textContent = money(total, data.moneyFormat); });

      var compare = variant.compare_at_price && variant.compare_at_price > variant.price ? variant.compare_at_price * bundle.qty : 0;
      if (priceWas) {
        priceWas.textContent = compare ? money(compare, data.moneyFormat) : '';
        priceWas.hidden = !compare;
      }
      if (saveBadge) {
        var pctOff = compare ? Math.round((1 - total / compare) * 100) : 0;
        saveBadge.textContent = data.strings.save.replace('[percent]', pctOff);
        saveBadge.hidden = pctOff <= 0;
      }

      atcButtons.forEach(function (b) {
        b.disabled = !variant.available;
        b.textContent = variant.available ? data.strings.addToCart : data.strings.soldOut;
      });

      if (variant.featured_image) showMedia(variant.featured_image, variant.name);

      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    root.addEventListener('change', function (e) {
      if (e.target.closest('[data-gh-option]') || e.target.closest('[data-gh-bundle]')) render();
    });

    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { showMedia(t.dataset.src, t.dataset.alt); });
    });

    // Sticky bar and secondary buttons submit the main form.
    root.querySelectorAll('[data-gh-submit-main]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (form.requestSubmit) form.requestSubmit(); else form.submit();
      });
    });

    var sticky = root.querySelector('[data-gh-sticky]');
    var anchor = root.querySelector('[data-gh-form]');
    if (sticky && anchor && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          sticky.classList.toggle('is-visible', past);
        });
      }).observe(anchor);
    }

    render();
  }

  function boot() { document.querySelectorAll('[data-gh-root]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
