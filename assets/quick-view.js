/**
 * Quick View — quick-view.js
 *
 * Responsibilities:
 *  1. Listen for clicks on [data-qv-trigger] buttons (eye icon on product cards)
 *  2. Fetch product JSON from /products/{handle}.js
 *  3. Populate and show #quick-view-overlay
 *  4. Handle variant selection, quantity, Add to Cart, Buy it Now
 *  5. Prev/Next navigation between products in the same section
 *  6. Keyboard trap + close on backdrop / Escape
 */

(() => {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */
  let currentHandle = null;
  let currentProduct = null;
  let currentVariantId = null;

  /* Ordered list of handles in the current section (for prev/next) */
  let sectionHandles = [];
  let sectionIndex = 0;

  /* ── DOM refs ─────────────────────────────────────────────── */
  const overlay    = document.getElementById('quick-view-overlay');
  if (!overlay) return; // snippet not rendered

  const backdrop   = overlay.querySelector('.qv-backdrop');
  const closeBtn   = overlay.querySelector('.qv-close');
  const prevBtn    = overlay.querySelector('.qv-nav--prev');
  const nextBtn    = overlay.querySelector('.qv-nav--next');
  const image      = overlay.querySelector('.qv-image');
  const title      = overlay.querySelector('.qv-title');
  const priceEl    = overlay.querySelector('.qv-price');
  const badgeEl    = overlay.querySelector('.qv-badge');
  const optionsEl  = overlay.querySelector('.qv-options');
  const qtyInput   = overlay.querySelector('.qv-qty-input');
  const qtyMinus   = overlay.querySelector('.qv-qty-minus');
  const qtyPlus    = overlay.querySelector('.qv-qty-plus');
  const atcBtn     = overlay.querySelector('.qv-atc-btn');
  const fullLink   = overlay.querySelector('.qv-full-link');
  const modal      = overlay.querySelector('.qv-modal');

  /* ── Helpers ─────────────────────────────────────────────── */
  const formatMoney = (cents) => {
    const amount = (cents / 100).toFixed(2);
    return window.Shopify && window.Shopify.currency
      ? `${window.Shopify.currency.active} ${amount}`
      : `£${amount}`;
  };

  const setLoading = (on) => modal.classList.toggle('is-loading', on);

  /* ── Fetch product ───────────────────────────────────────── */
  async function loadProduct(handle) {
    setLoading(true);
    try {
      const res = await fetch(`/products/${handle}.js`);
      if (!res.ok) throw new Error('Product not found');
      return await res.json();
    } finally {
      setLoading(false);
    }
  }

  /* ── Populate modal ──────────────────────────────────────── */
  function populate(product, preselectedVariantId) {
    currentProduct = product;

    /* title */
    title.textContent = product.title;

    /* variant to show initially */
    const variant = preselectedVariantId
      ? product.variants.find(v => v.id === preselectedVariantId) || product.variants[0]
      : product.variants[0];

    currentVariantId = variant.id;

    /* image */
    const imgSrc = variant.featured_image
      ? variant.featured_image.src
      : product.featured_image || '';
    
    if (imgSrc) {
      const url = new URL(imgSrc, window.location.origin);
      url.searchParams.set('format', 'webp');
      
      url.searchParams.set('width', '400');
      const src400 = url.toString();
      url.searchParams.set('width', '600');
      const src600 = url.toString();
      url.searchParams.set('width', '800');
      const src800 = url.toString();
      
      image.srcset = `${src400} 400w, ${src600} 600w, ${src800} 800w`;
      image.sizes = "(max-width: 680px) 100vw, 50vw";
      url.searchParams.set('width', '600');
      image.src = url.toString();
      
      if (variant.featured_image && variant.featured_image.width) {
        image.width = variant.featured_image.width;
        image.height = variant.featured_image.height;
      }
    } else {
      image.src = '';
      image.srcset = '';
    }
    image.alt = product.title;

    /* price */
    renderPrice(variant);

    /* options */
    renderOptions(product, variant);

    /* full link */
    fullLink.href = `/products/${product.handle}`;

    /* qty reset */
    qtyInput.value = 1;

    /* atc state */
    updateAtcState(variant);
  }

  function renderPrice(variant) {
    priceEl.textContent = formatMoney(variant.price);

    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      const pct = Math.round((1 - variant.price / variant.compare_at_price) * 100);
      badgeEl.textContent = `${pct}%`;
      badgeEl.style.display = '';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  function renderOptions(product, activeVariant) {
    if (!product.options || product.options[0] === 'Title') {
      optionsEl.innerHTML = '';
      return;
    }

    let html = '';
    product.options.forEach((opt, optIndex) => {
      const optName = opt.name || opt;
      const key = `option${optIndex + 1}`;
      const values = [...new Set(product.variants.map(v => v[key]).filter(Boolean))];

      html += `<div class="qv-option-group">`;
      html += `<div class="qv-option-label">${optName}</div>`;
      html += `<div class="qv-variant-btns">`;
      values.forEach(val => {
        const isActive   = activeVariant[key] === val;
        const inStock    = product.variants.some(v => v[key] === val && v.available);
        html += `<button
          class="qv-variant-btn${isActive ? ' is-active' : ''}${!inStock ? ' is-soldout' : ''}"
          data-opt-index="${optIndex}"
          data-opt-key="${key}"
          data-opt-value="${val}"
          ${!inStock ? 'aria-disabled="true"' : ''}
        >${val}</button>`;
      });
      html += `</div></div>`;
    });

    optionsEl.innerHTML = html;
  }

  function updateAtcState(variant) {
    atcBtn.dataset.variantId = variant.id;

    if (!variant.available) {
      atcBtn.textContent = 'SOLD OUT';
      atcBtn.disabled = true;
    } else {
      atcBtn.textContent = 'ADD TO CART';
      atcBtn.disabled = false;
    }
  }

  /* ── Variant selection ────────────────────────────────────── */
  optionsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.qv-variant-btn');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;

    const optKey   = btn.dataset.optKey;
    const optValue = btn.dataset.optValue;

    /* build a selection map from currently active buttons */
    const selection = {};
    optionsEl.querySelectorAll('.qv-variant-btn.is-active').forEach(b => {
      selection[b.dataset.optKey] = b.dataset.optValue;
    });
    selection[optKey] = optValue;

    /* find matching variant */
    const matched = currentProduct.variants.find(v =>
      Object.entries(selection).every(([k, val]) => v[k] === val)
    );

    if (!matched) return;

    currentVariantId = matched.id;

    /* update image if variant has one */
    if (matched.featured_image) {
      const url = new URL(matched.featured_image.src, window.location.origin);
      url.searchParams.set('format', 'webp');
      url.searchParams.set('width', '400');
      const src400 = url.toString();
      url.searchParams.set('width', '600');
      const src600 = url.toString();
      url.searchParams.set('width', '800');
      const src800 = url.toString();
      image.srcset = `${src400} 400w, ${src600} 600w, ${src800} 800w`;
      url.searchParams.set('width', '600');
      image.src = url.toString();
      
      if (matched.featured_image.width) {
        image.width = matched.featured_image.width;
        image.height = matched.featured_image.height;
      }
    }

    renderPrice(matched);
    renderOptions(currentProduct, matched);
    updateAtcState(matched);
  });

  /* ── Quantity controls ────────────────────────────────────── */
  qtyMinus.onclick = (e) => {
    e.preventDefault();
    const val = parseInt(qtyInput.value, 10) || 1;
    if (val > 1) qtyInput.value = val - 1;
  };

  qtyPlus.onclick = (e) => {
    e.preventDefault();
    const val = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = val + 1;
  };

  /* ── Add to Cart ─────────────────────────────────────────── */
  let isAdding = false;
  atcBtn.onclick = async (e) => {
    e.preventDefault();
    if (!currentVariantId || isAdding) return;
    const quantity = parseInt(qtyInput.value, 10) || 1;

    isAdding = true;
    atcBtn.disabled = true;
    atcBtn.textContent = 'ADDING…';

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentVariantId, quantity })
      });

      if (!res.ok) throw new Error('Cart add failed');

      // Trigger theme's native cart update/drawer
      document.dispatchEvent(new CustomEvent('theme:cart:reload', { bubbles: true }));

      atcBtn.textContent = '✓ ADDED';
      setTimeout(() => {
        atcBtn.textContent = 'ADD TO CART';
        atcBtn.disabled = false;
        isAdding = false;

        /* Update cart count bubble if the theme has one */
        document.querySelectorAll('[data-cart-count], .cart-count, .js-cart-count').forEach(el => {
          fetch('/cart.js')
            .then(r => r.json())
            .then(cart => { el.textContent = cart.item_count; })
            .catch(() => {});
        });
      }, 1800);
    } catch (err) {
      console.error('[QuickView] ATC error:', err);
      atcBtn.textContent = 'TRY AGAIN';
      atcBtn.disabled = false;
      isAdding = false;
    }
  };

  /* ── Prev / Next ─────────────────────────────────────────── */
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));

  function navigate(dir) {
    if (!sectionHandles.length) return;
    sectionIndex = (sectionIndex + dir + sectionHandles.length) % sectionHandles.length;
    openQuickView(sectionHandles[sectionIndex], null, false);
  }

  /* ── Open / Close ─────────────────────────────────────────── */
  async function openQuickView(handle, variantId, rebuildSiblings) {
    currentHandle = handle;

    /* build prev/next list from all trigger buttons on the page */
    if (rebuildSiblings !== false) {
      sectionHandles = [...document.querySelectorAll('[data-qv-trigger]')]
        .map(btn => btn.dataset.qvHandle)
        .filter(Boolean);
      sectionIndex = sectionHandles.indexOf(handle);
    }

    /* show overlay immediately (skeleton feel) */
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    try {
      const product = await loadProduct(handle);
      populate(product, variantId ? parseInt(variantId, 10) : null);
    } catch (err) {
      console.error('[QuickView] Load error:', err);
      closeQuickView();
    }

    /* focus management */
    closeBtn.focus();
  }

  function closeQuickView() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
    currentHandle = null;
  }

  /* ── Global click delegation ─────────────────────────────── */
  document.addEventListener('click', (e) => {
    /* Eye icon trigger */
    const trigger = e.target.closest('[data-qv-trigger]');
    if (trigger) {
      e.preventDefault();
      openQuickView(
        trigger.dataset.qvHandle,
        trigger.dataset.qvVariant || null,
        true
      );
      return;
    }

    /* Backdrop close */
    if (e.target === backdrop) closeQuickView();
  });

  closeBtn.addEventListener('click', closeQuickView);

  /* ── Keyboard ─────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (overlay.hasAttribute('hidden')) return;

    if (e.key === 'Escape') closeQuickView();

    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);

    /* Focus trap */
    if (e.key === 'Tab') {
      const focusables = [...overlay.querySelectorAll(
        'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
      )];
      if (!focusables.length) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

})();
