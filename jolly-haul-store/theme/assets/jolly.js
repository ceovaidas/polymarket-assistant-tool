/* GNARHEAD landing — gallery slider, face swatches, bundles, crew "Choose" buttons, sticky add-to-cart.
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
    var stickySub = root.querySelector('[data-gh-sticky-sub]');

    function each(sel, fn) { root.querySelectorAll(sel).forEach(fn); }

    /* ---------- Gallery slider ---------- */
    var slides = track ? track.children.length : 0;
    function currentSlide() { return track ? Math.round(track.scrollLeft / track.clientWidth) : 0; }
    function goTo(i) {
      if (!track) return;
      i = Math.max(0, Math.min(slides - 1, i));
      track.scrollTo({ left: i * track.clientWidth });
    }
    function markSlide() {
      var i = currentSlide();
      each('[data-gh-dots] button', function (b, n) { b.setAttribute('aria-current', String(n === i)); });
      each('[data-gh-thumbs] button', function (b, n) { b.setAttribute('aria-current', String(n === i)); });
    }
    if (track) {
      var raf = 0;
      track.addEventListener('scroll', function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(markSlide);
      }, { passive: true });
      var prev = root.querySelector('[data-gh-prev]');
      var next = root.querySelector('[data-gh-next]');
      if (prev) prev.addEventListener('click', function () { goTo(currentSlide() - 1); });
      if (next) next.addEventListener('click', function () {
        var i = currentSlide();
        goTo(i >= slides - 1 ? 0 : i + 1);
      });
      each('[data-gh-dots] button', function (b, n) { b.addEventListener('click', function () { goTo(n); }); });
      each('[data-gh-thumbs] button', function (b, n) { b.addEventListener('click', function () { goTo(n); }); });
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
      goTo(0);
    }

    // No product photos yet: mirror the selected swatch's illustration into the first slide.
    function showSwatchArt() {
      var heroPh = hero && hero.querySelector('.gh-ph');
      var checked = root.querySelector('.gh-swatch input:checked');
      var art = checked && checked.closest('.gh-swatch').querySelector('.gh-swatch__img');
      var svg = art && art.querySelector('.gh-ph svg');
      if (!heroPh || !svg) return;
      var old = heroPh.querySelector('svg');
      if (old) heroPh.removeChild(old);
      heroPh.insertBefore(svg.cloneNode(true), heroPh.firstChild);
      hero.style.setProperty('--tone', art.style.getPropertyValue('--tone'));
      goTo(0);
    }

    /* ---------- Variants & bundles ---------- */
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
      return c ? { qty: +c.value || 1, pct: +c.dataset.pct || 0, label: c.dataset.label || '' } : { qty: 1, pct: 0, label: '' };
    }

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
        var t = Math.round(variant.price * q * (1 - (+input.dataset.pct || 0) / 100));
        var row = input.nextElementSibling;
        row.querySelector('[data-gh-bundle-now]').textContent = money(t, data.moneyFormat);
        row.querySelector('[data-gh-bundle-was]').textContent = base * q > t ? money(base * q, data.moneyFormat) : '';
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
      if (stickySub) stickySub.textContent = variant.title + (b.qty > 1 ? ' × ' + b.qty : '');

      if (changedOption) {
        if (variant.image) setHero(variant.image, variant.title); else showSwatchArt();
        if (window.history && window.history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
    }

    root.addEventListener('change', function (e) {
      if (e.target.closest('[data-gh-option]')) render(true);
      else if (e.target.closest('[data-gh-bundle]')) render(false);
    });

    /* ---------- Crew "Choose" buttons ---------- */
    each('[data-gh-pick]', function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.dataset.ghPick;
        var input = Array.prototype.find.call(root.querySelectorAll('[data-gh-option] input'), function (i) { return i.value === value; });
        if (!input) return;
        input.checked = true;
        render(true);
        var target = root.querySelector('.gh-gallery') || form;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    each('[data-gh-submit-main]', function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (form.requestSubmit) form.requestSubmit(); else form.submit();
      });
    });

    /* ---------- Sticky bar (shown once the main button has scrolled away) ---------- */
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
