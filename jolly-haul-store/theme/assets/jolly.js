/* Jolly Haul — product page (gallery, swatches, bundles, crew buttons, sticky add-to-cart)
   and home page (Christmas countdown). Pairs with sections/jolly-product + jolly-home. No dependencies. */
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
    if (root.dataset.jhReady) return;
    root.dataset.jhReady = '1';

    var dataEl = root.querySelector('[data-jh-json]');
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var variants = data.variants || [];
    var form = root.querySelector('[data-jh-form]');
    var idInput = root.querySelector('[data-jh-variant-id]');
    var qtyInput = root.querySelector('[data-jh-qty]');
    var track = root.querySelector('[data-jh-track]');
    var hero = root.querySelector('[data-jh-hero]');
    var stickySub = root.querySelector('[data-jh-sticky-sub]');

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
      each('[data-jh-dots] button', function (b, n) { b.setAttribute('aria-current', String(n === i)); });
      each('[data-jh-thumbs] button', function (b, n) { b.setAttribute('aria-current', String(n === i)); });
    }
    if (track) {
      var raf = 0;
      track.addEventListener('scroll', function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(markSlide);
      }, { passive: true });
      var prev = root.querySelector('[data-jh-prev]');
      var next = root.querySelector('[data-jh-next]');
      if (prev) prev.addEventListener('click', function () { goTo(currentSlide() - 1); });
      if (next) next.addEventListener('click', function () {
        var i = currentSlide();
        goTo(i >= slides - 1 ? 0 : i + 1);
      });
      each('[data-jh-dots] button', function (b, n) { b.addEventListener('click', function () { goTo(n); }); });
      each('[data-jh-thumbs] button', function (b, n) { b.addEventListener('click', function () { goTo(n); }); });
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
      var heroPh = hero && hero.querySelector('.jh-ph');
      var checked = root.querySelector('.jh-swatch input:checked');
      var art = checked && checked.closest('.jh-swatch').querySelector('.jh-swatch__img');
      var svg = art && art.querySelector('.jh-ph svg');
      if (!heroPh || !svg) return;
      var old = heroPh.querySelector('svg');
      if (old) heroPh.removeChild(old);
      heroPh.insertBefore(svg.cloneNode(true), heroPh.firstChild);
      hero.style.setProperty('--tone', art.style.getPropertyValue('--tone'));
      goTo(0);
    }

    /* ---------- Variants & bundles ---------- */
    function selectedOptions() {
      return Array.prototype.map.call(root.querySelectorAll('[data-jh-option]'), function (fs) {
        var c = fs.querySelector('input:checked');
        return c ? c.value : null;
      });
    }
    function findVariant(values) {
      // Products without option pickers (single "Default Title" variant): use the current variant.
      if (!values.length) return variants.find(function (v) { return String(v.id) === idInput.value; }) || variants[0];
      return variants.find(function (v) {
        return v.options.every(function (opt, i) { return opt === values[i]; });
      });
    }
    function bundle() {
      var c = root.querySelector('[data-jh-bundle] input:checked');
      return c ? { qty: +c.value || 1, pct: +c.dataset.pct || 0, label: c.dataset.label || '' } : { qty: 1, pct: 0, label: '' };
    }

    function render(changedOption) {
      var values = selectedOptions();
      var variant = findVariant(values);
      var b = bundle();

      each('[data-jh-option-value]', function (el) { el.textContent = values[+el.dataset.jhOptionValue] || ''; });

      if (!variant) {
        each('[data-jh-atc]', function (btn) { btn.disabled = true; });
        each('[data-jh-atc-label]', function (el) { el.textContent = data.strings.unavailable; });
        return;
      }

      idInput.value = variant.id;
      qtyInput.value = b.qty;

      var base = variant.compare_at_price > variant.price ? variant.compare_at_price : variant.price;
      each('[data-jh-bundle] input', function (input) {
        var q = +input.value || 1;
        var t = Math.round(variant.price * q * (1 - (+input.dataset.pct || 0) / 100));
        var row = input.nextElementSibling;
        row.querySelector('[data-jh-bundle-now]').textContent = money(t, data.moneyFormat);
        row.querySelector('[data-jh-bundle-was]').textContent = base * q > t ? money(base * q, data.moneyFormat) : '';
      });

      var total = Math.round(variant.price * b.qty * (1 - b.pct / 100));
      var compare = base * b.qty;
      each('[data-jh-price]', function (el) { el.textContent = money(total, data.moneyFormat); });

      var was = root.querySelector('[data-jh-compare]');
      if (was) { was.hidden = compare <= total; was.textContent = compare > total ? money(compare, data.moneyFormat) : ''; }
      var save = root.querySelector('[data-jh-save]');
      if (save) {
        var pct = compare > total ? Math.round((1 - total / compare) * 100) : 0;
        save.hidden = pct <= 0;
        save.textContent = data.strings.save.replace('[percent]', pct);
      }

      each('[data-jh-atc]', function (btn) { btn.disabled = !variant.available; });
      each('[data-jh-atc-label]', function (el) { el.textContent = variant.available ? data.strings.addToCart : data.strings.soldOut; });
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
      if (e.target.closest('[data-jh-option]')) render(true);
      else if (e.target.closest('[data-jh-bundle]')) render(false);
    });

    /* ---------- Crew "Choose" buttons ---------- */
    each('[data-jh-pick]', function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.dataset.jhPick;
        var input = Array.prototype.find.call(root.querySelectorAll('[data-jh-option] input'), function (i) { return i.value === value; });
        if (!input) return;
        input.checked = true;
        render(true);
        var target = root.querySelector('.jh-gallery') || form;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    each('[data-jh-submit-main]', function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (form.requestSubmit) form.requestSubmit(); else form.submit();
      });
    });

    /* ---------- Sticky bar (shown once the main button has scrolled away) ---------- */
    var sticky = root.querySelector('[data-jh-sticky]');
    if (sticky && form) {
      var ticking = false;
      var updateSticky = function () {
        ticking = false;
        var on = form.getBoundingClientRect().bottom < 0;
        sticky.classList.toggle('is-visible', on);
        document.documentElement.classList.toggle('jh-sticky-on', on && window.innerWidth < 990);
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(updateSticky); }
      }, { passive: true });
      updateSticky();
    }

    render(false);
  }

  /* ---------- Countdown to a real date (home page) ---------- */
  function countdown(el) {
    if (el.dataset.jhReady) return;
    el.dataset.jhReady = '1';
    var parts = (el.dataset.jhCountdown || '').split('-');
    var target = new Date(+parts[0], (+parts[1] || 1) - 1, +parts[2] || 1).getTime();
    if (isNaN(target)) return;
    var d = el.querySelector('[data-jh-d]'), h = el.querySelector('[data-jh-h]'), m = el.querySelector('[data-jh-m]');
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function tick() {
      var left = target - Date.now();
      if (left <= 0) { el.hidden = true; return; }
      d.textContent = Math.floor(left / 864e5);
      h.textContent = pad(Math.floor(left / 36e5) % 24);
      m.textContent = pad(Math.floor(left / 6e4) % 60);
      setTimeout(tick, 30000);
    }
    tick();
  }

  /* ---------- Christmas prize wheel ---------- */
  var COLORS = {
    pine: ['#1f6b4e', '#ffffff'], cranberry: ['#e0313f', '#ffffff'],
    cream: ['#fff6e6', '#1b2420'], gold: ['#f2b33d', '#12291f']
  };
  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { return null; }
  }

  function wheel(root) {
    if (root.dataset.jhReady) return;
    root.dataset.jhReady = '1';
    var path = window.location.pathname;
    if (/^\/(cart|checkout|account|checkouts)/.test(path) || /\/(cart|checkouts?)(\/|$)/.test(path)) return;

    var data = JSON.parse(root.querySelector('[data-jh-wheel-json]').textContent || '{}');
    var prizes = (data.prizes || []).filter(function (p) { return p.code && p.weight > 0; });
    if (prizes.length < 2) return;

    var layer = root.querySelector('[data-jh-wheel-layer]');
    var dialog = root.querySelector('.jh-wheel__dialog');
    var disc = root.querySelector('[data-jh-wheel-disc]');
    var teaser = root.querySelector('[data-jh-wheel-open]');
    var teaserText = root.querySelector('[data-jh-teaser]');
    var steps = root.querySelectorAll('[data-jh-step]');
    var spinBtns = root.querySelectorAll('[data-jh-spin]');
    var lastFocus = null;
    var KEY_WIN = 'jh-wheel-win', KEY_SNOOZE = 'jh-wheel-snooze';

    // Draw the wheel.
    var seg = 360 / prizes.length, r = 100, svgNS = 'http://www.w3.org/2000/svg', html = '';
    function pt(deg, rad) { var a = (deg - 90) * Math.PI / 180; return [(rad * Math.cos(a)).toFixed(2), (rad * Math.sin(a)).toFixed(2)]; }
    prizes.forEach(function (p, i) {
      var c = COLORS[p.color] || COLORS.pine, a0 = i * seg, a1 = a0 + seg, s0 = pt(a0, r), s1 = pt(a1, r), mid = a0 + seg / 2;
      html += '<path d="M0 0L' + s0[0] + ' ' + s0[1] + 'A' + r + ' ' + r + ' 0 0 1 ' + s1[0] + ' ' + s1[1] + 'Z" fill="' + c[0] + '" stroke="#12291f" stroke-width="1.2"/>';
      html += '<g transform="rotate(' + mid + ')"><text y="-66" text-anchor="middle" fill="' + c[1] + '" font-family="Rubik, sans-serif" font-weight="900" font-size="' + (p.label.length > 5 ? 11 : 16) + '">' + escapeXml(p.label) + '</text>' +
        '<text y="-52" text-anchor="middle" fill="' + c[1] + '" font-family="Rubik, sans-serif" font-weight="700" font-size="8" letter-spacing=".6">' + escapeXml(p.sub || '') + '</text></g>';
    });
    html += '<circle r="' + (r + 6) + '" fill="none" stroke="#f2b33d" stroke-width="10"/>';
    for (var b = 0; b < 24; b++) { var q = pt(b * 15, r + 6); html += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="2.4" fill="' + (b % 2 ? '#fff6e6' : '#e0313f') + '"/>'; }
    disc.innerHTML = html;
    function escapeXml(t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

    function show(step) { steps.forEach(function (el) { el.hidden = el.dataset.jhStep !== step; }); }

    function showWin(win) {
      root.querySelector('[data-jh-prize]').textContent = win.label + (win.sub ? ' ' + win.sub : '');
      root.querySelector('[data-jh-prize-note]').textContent = win.note || '';
      root.querySelector('[data-jh-code]').textContent = win.code;
      root.querySelector('[data-jh-apply]').href = '/discount/' + encodeURIComponent(win.code) + '?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      spinBtns.forEach(function (btn) { btn.disabled = true; });
      show('win');
      teaserText.textContent = 'Your code: ' + win.code;
    }

    function trap(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(dialog.querySelectorAll('button, a[href], input'), function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    function open() {
      if (!layer.hidden) return;
      lastFocus = document.activeElement;
      layer.hidden = false;
      teaser.hidden = true;
      document.documentElement.classList.add('jh-lock');
      document.addEventListener('keydown', trap);
      dialog.focus();
    }
    function close() {
      if (layer.hidden) return;
      layer.hidden = true;
      document.documentElement.classList.remove('jh-lock');
      document.removeEventListener('keydown', trap);
      if (!store(KEY_WIN)) store(KEY_SNOOZE, Date.now() + (+root.dataset.snooze || 7) * 864e5);
      teaser.hidden = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    var spun = false, angle = 0;
    function spin() {
      if (spun) return;
      spun = true;
      spinBtns.forEach(function (btn) { btn.disabled = true; });
      show('spinning');
      var total = prizes.reduce(function (sum, p) { return sum + p.weight; }, 0), roll = Math.random() * total, idx = 0;
      for (var i = 0; i < prizes.length; i++) { roll -= prizes[i].weight; if (roll < 0) { idx = i; break; } }
      var jitter = (Math.random() - 0.5) * seg * 0.6;
      angle = 360 * 6 + (360 - (idx * seg + seg / 2)) + jitter;
      disc.style.transform = 'rotate(' + angle + 'deg)';
      var ms = parseFloat(getComputedStyle(disc).transitionDuration) * 1000 || 0;
      setTimeout(function () {
        var p = prizes[idx], win = { label: p.label, sub: p.sub, note: p.note, code: p.code };
        store(KEY_WIN, win);
        showWin(win);
      }, ms + 150);
    }

    spinBtns.forEach(function (btn) { btn.addEventListener('click', spin); });
    root.querySelectorAll('[data-jh-wheel-close]').forEach(function (el) { el.addEventListener('click', close); });
    teaser.addEventListener('click', open);
    root.querySelector('[data-jh-copy]').addEventListener('click', function (e) {
      var code = root.querySelector('[data-jh-code]').textContent, btn = e.currentTarget;
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
      else { var t = document.createElement('textarea'); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (err) {} t.remove(); done(); }
    });

    var win = store(KEY_WIN);
    if (win) {
      spun = true;
      showWin(win);
      teaser.hidden = false;
      if (/customer_posted=true/.test(window.location.search)) open();
      return;
    }
    teaser.hidden = false;
    var snooze = store(KEY_SNOOZE);
    if (snooze && snooze > Date.now()) return;
    var autoOpened = false;
    function autoOpen() { if (!autoOpened && !spun) { autoOpened = true; open(); } }
    setTimeout(autoOpen, (+root.dataset.delay || 8) * 1000);
    if (root.dataset.exit === 'true' && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0) autoOpen(); });
    }
  }

  function boot() {
    document.querySelectorAll('[data-jh-root]').forEach(init);
    document.querySelectorAll('[data-jh-countdown]').forEach(countdown);
    document.querySelectorAll('[data-jh-wheel]').forEach(wheel);
    document.querySelectorAll('[data-jh-sort]').forEach(function (sel) {
      if (sel.dataset.jhReady) return;
      sel.dataset.jhReady = '1';
      sel.addEventListener('change', function () {
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', sel.value);
        url.searchParams.delete('page');
        window.location.href = url.toString();
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', boot);
})();
