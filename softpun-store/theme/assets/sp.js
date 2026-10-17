/* Softpun: countdown, delivery dates, product options + gallery, buddy deal, pick-a-box pop-up. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (c) { return '$' + (Math.max(0, c) / 100).toFixed(2); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* Countdown to a real end date; hides once it has passed */
  var count = $('[data-sp-count]');
  if (count) {
    var end = new Date(count.dataset.spCount).getTime();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    var tick = function () {
      var left = end - Date.now();
      if (!(left > 0)) { count.hidden = true; return false; }
      count.hidden = false;
      var s = Math.floor(left / 1000);
      $('[data-d]', count).textContent = pad(Math.floor(s / 86400));
      $('[data-h]', count).textContent = pad(Math.floor(s % 86400 / 3600));
      $('[data-m]', count).textContent = pad(Math.floor(s % 3600 / 60));
      $('[data-s]', count).textContent = pad(s % 60);
      return true;
    };
    if (tick()) setInterval(tick, 1000);
  }

  /* Real delivery window as dates: today + N business days (weekends skipped) */
  var addBiz = function (n) {
    var d = new Date();
    while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; }
    return d;
  };
  var fmt = function (d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  $$('[data-sp-eta]').forEach(function (el) {
    var lo = +el.dataset.min, hi = +el.dataset.max;
    if (!(lo > 0) || !(hi >= lo)) return;
    el.textContent = '🚚 Arrives ' + fmt(addBiz(lo)) + ' – ' + fmt(addBiz(hi)) + ', tracked';
  });

  /* Product page */
  var pdp = $('[data-sp-product]');
  if (pdp) {
    var variants = JSON.parse(($('[data-sp-variants]', pdp) || {}).textContent || '[]');
    var idInput = $('[data-sp-id]', pdp);
    var slides = $$('.sp-stage__slide', pdp), dots = $$('[data-sp-dot]', pdp), cur = 0;
    var show = function (i) {
      if (!slides.length) return;
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === cur); });
      dots.forEach(function (d, k) { d.classList.toggle('is-on', k === cur); });
    };
    dots.forEach(function (d) { d.addEventListener('click', function () { show(+d.dataset.spDot); }); });
    var prev = $('[data-sp-prev]', pdp), next = $('[data-sp-next]', pdp);
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });

    var chosen = function () { return $$('[data-sp-opt]', pdp).map(function (f) { var c = $('input:checked', f); return c ? c.value : null; }); };
    var find = function (opts) { return variants.find(function (v) { return v.options.every(function (o, i) { return opts[i] == null || o === opts[i]; }); }); };
    var update = function () {
      var v = find(chosen());
      var add = $('[data-sp-add]', pdp), buy = $('[data-sp-buy]', pdp);
      if (!v) { add.disabled = buy.disabled = true; add.textContent = 'Unavailable'; return; }
      idInput.value = v.id;
      add.disabled = buy.disabled = !v.available;
      add.textContent = v.available ? 'Add to bag' : 'Sold out';
      $('[data-sp-price]', pdp).textContent = money(v.price);
      var cmp = $('[data-sp-compare]', pdp);
      if (cmp) { cmp.hidden = !(v.compare_at_price > v.price); cmp.textContent = money(v.compare_at_price || 0); }
      // mark values that are sold out in combination with the other choices
      $$('[data-sp-opt]', pdp).forEach(function (f, oi) {
        $$('.sp-pill', f).forEach(function (pill) {
          var opts = chosen(); opts[oi] = $('input', pill).value;
          var m = find(opts);
          pill.classList.toggle('is-out', !m || !m.available);
        });
      });
    };
    $$('[data-sp-opt] input', pdp).forEach(function (i) { i.addEventListener('change', update); });
    if (variants.length) update();

    /* Buddy deal: two tees, add both */
    var bundle = $('[data-sp-bundle]', pdp);
    if (bundle) {
      var picks = $$('[data-sp-bundle-pick]', bundle), off = +bundle.dataset.off || 0;
      var sum = function () {
        var total = picks.reduce(function (a, s) { return a + (+s.selectedOptions[0].dataset.price || 0); }, 0);
        var full = $('[data-sp-bundle-full]', bundle);
        if (full) full.textContent = money(total);
        $('[data-sp-bundle-price]', bundle).textContent = money(total - off);
      };
      picks.forEach(function (s) { s.addEventListener('change', sum); });
      sum();
      $('[data-sp-bundle-add]', bundle).addEventListener('click', function () {
        var btn = this; btn.disabled = true; btn.textContent = 'Adding…';
        var items = picks.map(function (s) { return { id: +s.value, quantity: 1 }; });
        fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: items }) })
          .then(function (r) { if (!r.ok) throw new Error(); location.href = '/cart'; })
          .catch(function () { btn.disabled = false; btn.textContent = 'Try again'; });
      });
    }
  }

  /* Pick-a-box pop-up */
  var pop = $('[data-sp-pop]');
  if (pop && !store.get('sp-pop-done')) {
    var steps = function (name) { $$('[data-step]', pop).forEach(function (s) { s.hidden = s.dataset.step !== name; }); };
    var lastFocus = null;
    var open = function () {
      lastFocus = document.activeElement;
      pop.hidden = false; steps('pick');
      var first = $('[data-sp-box]', pop); if (first) first.focus();
    };
    var close = function () { pop.hidden = true; store.set('sp-pop-done', '1'); if (lastFocus && lastFocus.focus) lastFocus.focus(); };
    setTimeout(open, (+pop.dataset.delay || 8) * 1000);
    $$('[data-sp-pop-close]', pop).forEach(function (b) { b.addEventListener('click', close); });
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(); });
    $$('[data-sp-box]', pop).forEach(function (b) {
      b.addEventListener('click', function () {
        $('[data-sp-picked]', pop).textContent = b.dataset.spBox;
        var picked = $('.sp-boxes--one .sp-box', pop);
        picked.className = 'sp-box sp-box--on sp-box--' + b.dataset.spBox;
        steps('email');
        $('#sp-pop-email').focus();
      });
    });
    $('[data-sp-pop-form]', pop).addEventListener('submit', function (e) {
      e.preventDefault();
      var email = this.email.value.trim(), err = $('[data-sp-pop-err]', pop), btn = $('button', this);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'That email looks a bit off. Try again?'; return; }
      err.textContent = ''; btn.disabled = true;
      var code = pop.dataset.code;
      var body = new URLSearchParams({ form_type: 'customer', utf8: '✓', 'contact[email]': email, 'contact[tags]': 'newsletter,pick-a-box' });
      // Save the subscriber in Shopify, then put the code on the bag (Shopify's /discount/CODE route).
      fetch('/contact#contact_form', { method: 'POST', body: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
        .catch(function () {})
        .then(function () { return fetch('/discount/' + encodeURIComponent(code) + '?redirect=/').catch(function () {}); })
        .then(function () { steps('win'); store.set('sp-pop-done', '1'); btn.disabled = false; });
    });
    var copy = $('[data-sp-copy]', pop);
    if (copy) copy.addEventListener('click', function () {
      var c = pop.dataset.code;
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { copy.textContent = 'Copied!'; }, function () { copy.textContent = c; });
    });
  }
})();
