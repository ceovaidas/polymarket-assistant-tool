/* GNARHEAD landing — variant swatches, bundle selector, gallery, sticky add-to-cart.
   Pairs with sections/gnarhead-product-landing.liquid. No dependencies. */
(function () {
  'use strict';

  function money(cents, format) {
    var value = (cents / 100).toFixed(2);
    if (!format) return '$' + value;
    return format
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(cents / 100).toString())
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, value.replace('.', ','))
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function init(root) {
    if (root.dataset.ghReady) return;
    root.dataset.ghReady = '1';

    var dataEl = root.querySelector('[data-gh-json]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var variants = data.variants || [];
    var form = root.querySelector('[data-gh-form]');
    var idInput = root.querySelector('[data-gh-variant-id]');
    var qtyInput = root.querySelector('[data-gh-qty]');
    var track = root.querySelector('[data-gh-track]');
    var hero = root.querySelector('[data-gh-hero]');
    var counter = root.querySelector('[data-gh-count]');
    var stickySub = root.querySelector('[data-gh-sticky-sub]');

    function selectedOptions() {
      return Array.prototype.map.call(root.querySelectorAll('[data-gh-option]'), function (fs) {
        var c = fs.querySelector('input:checked');
        return c ? c.value : null;
      });
    }

    function findVariant(values) {
      return variants.find(function (v) {
        return v.options.every(function (opt, i) { return opt === values[i]; });
      });
    }

    function bundle() {
      var c = root.querySelector('[data-gh-bundle] input:checked');
      return c ? { qty: +c.value || 1, pct: +c.dataset.pct || 0, label: c.getAttribute('aria-label') } : { qty: 1, pct: 0, label: '' };
    }

    function setHero(src, alt) {
      if (!hero || !src) return;
      var img = hero.querySelector('img');
      if (!img) {
        hero.innerHTML = '';
        img = document.createElement('img');
        hero.appendChild(img);
      }
      img.removeAttribute('srcset');
      img.src = src;
      img.alt = alt || '';
      if (track) track.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // No product photos yet: mirror the selected swatch's illustration into the main image.
    function showSwatchArt() {
      var heroPh = hero && hero.querySelector('.gh-ph');
      var swatch = root.querySelector('.gh-swatch input:checked');
      var art = swatch && swatch.closest('.gh-swatch').querySelector('.gh-swatch__img');
      if (!heroPh || !art || !art.querySelector('.gh-ph')) return;
      heroPh.querySelector('svg') && heroPh.removeChild(heroPh.querySelector('svg'));
      heroPh.insertBefore(art.querySelector('.gh-ph svg').cloneNode(true), heroPh.firstChild);
      hero.style.setProperty('--tone', art.style.getPropertyValue('--tone'));
      if (track) track.scrollTo({ left: 0, behavior: 'smooth' });
    }

    function each(sel, fn) { root.querySelectorAll(sel).forEach(fn); }

    function render(changedOption) {
      var values = selectedOptions();
      var variant = findVariant(values);
      var b = bundle();

      each('[data-gh-option-value]', function (el) { el.textContent = values[+el.dataset.ghOptionValue] || ''; });

      if (!variant) {
        each('[data-gh-atc]', function (btn) { btn.disabled = true; });
        each('[data-gh-atc-label]', function (el) { el.textContent = data.strings.unavailable; });
        return;
      }

      idInput.value = variant.id;
      qtyInput.value = b.qty;

      var base = variant.compare_at_price > variant.price ? variant.compare_at_price : variant.price;
      each('[data-gh-bundle] input', function (input) {
        var q = +input.value || 1;
        var total = Math.round(variant.price * q * (1 - (+input.dataset.pct || 0) / 100));
        var row = input.nextElementSibling;
        row.querySelector('[data-gh-bundle-now]').textContent = money(total, data.moneyFormat);
        row.querySelector('[data-gh-bundle-was]').textContent = base * q > total ? money(base * q, data.moneyFormat) : '';
      });

      var total = Math.round(variant.price * b.qty * (1 - b.pct / 100));
      var compare = base * b.qty;
      each('[data-gh-price]', function (el) { el.textContent = money(total, data.moneyFormat); });

      var was = root.querySelector('[data-gh-compare]');
      if (was) { was.hidden = compare <= total; was.textContent = compare > total ? money(compare, data.moneyFormat) : ''; }
      var save = root.querySelector('[data-gh-save]');
      if (save) {
        var pct = compare > total ? Math.round((1 - total / compare) * 100) : 0;
        save.hidden = pct <= 0;
        save.textContent = data.strings.save.replace('[percent]', pct);
      }

      each('[data-gh-atc]', function (btn) { btn.disabled = !variant.available; });
      each('[data-gh-atc-label]', function (el) { el.textContent = variant.available ? data.strings.addToCart : data.strings.soldOut; });
      if (stickySub) stickySub.textContent = variant.title + (b.qty > 1 ? ' · ' + b.label : '');

      if (changedOption && variant.image) setHero(variant.image, variant.title);
      else if (changedOption) showSwatchArt();

      if (window.history && window.history.replaceState && changedOption) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    root.addEventListener('change', function (e) {
      if (e.target.closest('[data-gh-option]')) render(true);
      else if (e.target.closest('[data-gh-bundle]')) render(false);
    });

    each('[data-gh-submit-main]', function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (form.requestSubmit) form.requestSubmit(); else form.submit();
      });
    });

    if (track && counter) {
      var total = track.children.length;
      track.addEventListener('scroll', function () {
        var i = Math.round(track.scrollLeft / track.clientWidth) + 1;
        counter.textContent = Math.min(i, total) + ' / ' + total;
      }, { passive: true });
    }

    var sticky = root.querySelector('[data-gh-sticky]');
    if (sticky && form) {
      var ticking = false;
      var updateSticky = function () {
        ticking = false;
        sticky.classList.toggle('is-visible', form.getBoundingClientRect().bottom < 0);
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(updateSticky); }
      }, { passive: true });
      updateSticky();
    }

    render(false);
  }

  function boot() { document.querySelectorAll('[data-gh-root]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
