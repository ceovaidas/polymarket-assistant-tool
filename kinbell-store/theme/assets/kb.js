/* One-product landing: gallery, bundle picker, delivery dates, sticky bar. */
(function () {
  var root = document.querySelector('[data-kb]');
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };

  var fmt = function (cents) {
    return '$' + (Math.max(0, cents) / 100).toFixed(2);
  };

  /* Gallery */
  var slides = $$('[data-kb-slide]'), thumbs = $$('[data-kb-thumb]');
  function show(i) {
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', String(k === i)); });
  }
  thumbs.forEach(function (t) { t.addEventListener('click', function () { show(+t.dataset.kbThumb); }); });
  var main = $('.kb-gallery__main'), x0 = null;
  if (main && slides.length > 1) {
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, cur = slides.findIndex(function (s) { return s.classList.contains('is-on'); });
      if (Math.abs(dx) > 40) show((cur + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
      x0 = null;
    });
  }

  /* Bundles: quantity + prices follow the chosen tier and variant */
  var unit = +root.dataset.unit || 0;
  var qtyInput = $('[data-kb-qty]'), variant = $('[data-kb-variant]');
  function selected() { return $('.kb-tier input:checked') || $('.kb-tier input'); }
  function update() {
    if (variant) { var o = variant.selectedOptions[0]; if (o && o.dataset.price) unit = +o.dataset.price; }
    $$('.kb-tier').forEach(function (t) {
      var inp = $('input', t), q = +inp.value, off = +inp.dataset.off || 0;
      t.classList.toggle('is-on', inp.checked);
      var price = $('[data-kb-tier-price]', t), full = $('[data-kb-tier-full]', t);
      if (price) price.textContent = fmt(unit * q - off);
      if (full) full.textContent = fmt(unit * q);
    });
    var s = selected();
    if (!s) return;
    var total = unit * (+s.value) - (+s.dataset.off || 0);
    if (qtyInput) qtyInput.value = s.value;
    $$('[data-kb-cta-price]').forEach(function (el) { el.textContent = fmt(total); });
    $$('[data-kb-sticky-price]').forEach(function (el) { el.textContent = fmt(total); });
  }
  $$('.kb-tier input').forEach(function (i) { i.addEventListener('change', update); });
  if (variant) variant.addEventListener('change', update);
  update();

  /* Delivery window: today + N business days (real numbers from the section settings) */
  var eta = $('[data-kb-eta] span');
  function addBusinessDays(d, n) {
    var r = new Date(d);
    while (n > 0) { r.setDate(r.getDate() + 1); var w = r.getDay(); if (w !== 0 && w !== 6) n--; }
    return r;
  }
  var min = +root.dataset.shipMin, max = +root.dataset.shipMax;
  if (eta && min && max) {
    var opt = { month: 'short', day: 'numeric' };
    var a = addBusinessDays(new Date(), min).toLocaleDateString('en-US', opt);
    var b = addBusinessDays(new Date(), max).toLocaleDateString('en-US', opt);
    var note = eta.innerHTML.split(' · ')[1];
    eta.innerHTML = 'Order today, delivered <b>' + a + ' – ' + b + '</b>' + (note ? ' · ' + note : '');
  }

  /* Smooth jump to the buy box */
  $$('[data-kb-jump]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var buy = document.getElementById('kb-buy');
      if (!buy) return;
      e.preventDefault();
      buy.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* Sticky bar once the buy button is off screen */
  var sticky = $('[data-kb-sticky]'), btn = $('[data-kb-submit]');
  if (sticky && btn && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var off = !es[0].isIntersecting && es[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-on', off);
      sticky.setAttribute('aria-hidden', String(!off));
      var link = $('a', sticky); if (link) link.tabIndex = off ? 0 : -1;
    }).observe(btn);
  }
})();
