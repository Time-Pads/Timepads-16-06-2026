(function () {
  'use strict';

  if (window.tpCartDrawerLoaded) return;
  window.tpCartDrawerLoaded = true;

  var latestRefresh = 0;
  var refreshDebounceTimer = null;
  var subtotalObserver = null;
  var cartToggles = '[data-drawer-toggle="drawer-cart"], [data-mobile-cart-trigger]';

  function getRoot() {
    if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
      return window.Shopify.routes.root;
    }
    if (window.theme && window.theme.routes && window.theme.routes.root_url) {
      return window.theme.routes.root_url;
    }
    return '/';
  }

  function getCartUrl() {
    if (window.theme && window.theme.routes && window.theme.routes.cart) {
      return window.theme.routes.cart + '.js';
    }
    return getRoot() + 'cart.js';
  }

  function formatMoney(cents) {
    var value;
    var currency = window.themeVendor && window.themeVendor.themeCurrency;
    var format = window.theme && window.theme.moneyFormat;

    if (currency && typeof currency.formatMoney === 'function' && format) {
      value = currency.formatMoney(cents, format);
      if (window.theme && window.theme.settings && window.theme.settings.currency_code_enable && window.theme.currencyCode) {
        value += ' ' + window.theme.currencyCode;
      }
    } else {
      try {
        value = new Intl.NumberFormat(document.documentElement.lang || 'en-IN', {
          style: 'currency',
          currency: (window.theme && window.theme.currency) || 'INR',
          maximumFractionDigits: 0
        }).format(cents / 100);
      } catch (error) {
        value = '₹' + Math.round(cents / 100);
      }
    }

    if (cents % 100 === 0) {
      value = value.replace(/[.,]00(?=\D*$)/, '');
    }

    return value;
  }

  function fetchCart() {
    return fetch(getCartUrl(), {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Unable to refresh cart');
      return response.json();
    });
  }

  function updateCount(cart) {
    var count = cart && typeof cart.item_count === 'number' ? cart.item_count : 0;
    document.querySelectorAll('[data-tp-cart-count]').forEach(function (node) {
      node.textContent = count;
    });
    document.querySelectorAll('[data-header-cart-count], .cart-count, .js-cart-count').forEach(function (node) {
      node.textContent = count;
    });
  }

  function updateTotal(cart) {
    if (!cart || typeof cart.total_price !== 'number') return;
    var formatted = formatMoney(cart.total_price);
    document.querySelectorAll('[data-tp-cart-total], [data-tp-order-value]').forEach(function (node) {
      node.textContent = formatted;
    });
  }

  function updateSavings(cart) {
    var rawSavingsEl = document.querySelector('[data-tp-raw-savings]');
    var totalSavings = null;

    if (rawSavingsEl && rawSavingsEl.dataset.tpRawSavings != null) {
      totalSavings = Number(rawSavingsEl.dataset.tpRawSavings) || 0;
    }

    if (totalSavings === null && cart && cart.items) {
      totalSavings = 0;
      cart.items.forEach(function (item) {
        var compare = Number(item.compare_at_price || item.original_price || item.price || 0);
        var final = Number(item.final_price || item.price || 0);
        if (compare > final) {
          totalSavings += (compare - final) * item.quantity;
        }
      });
    }

    totalSavings = totalSavings || 0;

    var badge = document.querySelector('[data-tp-saving-badge]');
    if (badge) {
      badge.style.display = totalSavings > 0 ? '' : 'none';
    }

    var savingsRow = document.querySelector('.tp-row-savings');
    if (savingsRow) {
      savingsRow.style.display = totalSavings > 0 ? '' : 'none';
    }

    document.querySelectorAll('[data-tp-savings-amount]').forEach(function (node) {
      node.textContent = formatMoney(totalSavings);
    });
  }

  function watchSubtotal() {
    if (subtotalObserver || !window.MutationObserver) return;

    var subtotal = document.querySelector('[data-cart-subtotal]');
    if (!subtotal) return;

    subtotalObserver = new MutationObserver(function () {
      updateSavings();
    });
    subtotalObserver.observe(subtotal, { childList: true, subtree: true });
  }

  function updateProgress(cart) {
    var progress = document.querySelector('[data-tp-cart-progress]');
    var topBar = document.querySelector('[data-tp-top-bar]');
    var coupon = document.querySelector('[data-tp-cart-coupon]');
    var voucher = document.querySelector('[data-tp-cart-voucher]');

    if (!cart || !cart.item_count) {
      if (progress) progress.hidden = true;
      if (topBar) topBar.classList.add('is-empty');
      if (coupon) coupon.hidden = true;
      if (voucher) voucher.hidden = true;
      return;
    }

    if (progress) progress.hidden = false;
    if (topBar) topBar.classList.remove('is-empty');
    if (coupon) coupon.hidden = false;
    if (voucher) voucher.hidden = false;

    if (!progress) return;

    var total = Number(cart.total_price) || 0;
    var freeThreshold = Number(progress.dataset.freeThreshold) || 499;
    var discountThreshold = Number(progress.dataset.discountThreshold) || 599;
    var maxThreshold = Number(progress.dataset.maxThreshold) || 999;
    var freeCents = freeThreshold * 100;
    var discountCents = discountThreshold * 100;
    var maxCents = maxThreshold * 100;

    var fill = progress.querySelector('[data-tp-progress-fill]');
    var message = progress.querySelector('[data-tp-progress-message]');

    var percent = 0;
    if (total <= 0) {
      percent = 0;
    } else if (total < freeCents) {
      percent = (total / freeCents) * 33.33;
    } else if (total < discountCents) {
      var stepDiff = discountCents - freeCents;
      var curDiff = total - freeCents;
      percent = 33.33 + (stepDiff > 0 ? (curDiff / stepDiff) * 33.33 : 0);
    } else if (total < maxCents) {
      var stepDiff = maxCents - discountCents;
      var curDiff = total - discountCents;
      percent = 66.66 + (stepDiff > 0 ? (curDiff / stepDiff) * 33.34 : 0);
    } else {
      percent = 100;
    }
    percent = Math.min(100, Math.max(0, percent));

    var freeLabel = progress.dataset.freeLabel || 'FREE SHIPPING';
    var discountLabel = progress.dataset.discountLabel || '5% OFF';
    var maxLabel = progress.dataset.maxLabel || '10% OFF';
    var messageText;

    if (total >= maxCents) {
      messageText = '<strong>' + maxLabel + ' UNLOCKED ✓</strong> &bull; All Offers Unlocked!';
    } else if (total >= discountCents) {
      messageText = '<strong>' + discountLabel + ' UNLOCKED ✓</strong> &bull; Add <strong class="tp-brand-amt">' + formatMoney(Math.max(0, maxCents - total)) + '</strong> more for <strong class="tp-brand-tag">' + maxLabel + '</strong>';
    } else if (total >= freeCents) {
      messageText = '<strong>' + freeLabel + ' UNLOCKED ✓</strong> &bull; Add <strong class="tp-brand-amt">' + formatMoney(Math.max(0, discountCents - total)) + '</strong> more for <strong class="tp-brand-tag">' + discountLabel + '</strong>';
    } else {
      messageText = 'Add <strong class="tp-brand-amt">' + formatMoney(Math.max(0, freeCents - total)) + '</strong> more to unlock <strong class="tp-brand-tag">' + freeLabel + '</strong> 🚚';
    }

    if (fill) fill.style.width = percent + '%';
    if (message) message.innerHTML = messageText;

    progress.querySelectorAll('[data-tp-milestone]').forEach(function (milestone) {
      var threshold = Number(milestone.dataset.threshold) || 0;
      milestone.classList.toggle('is-unlocked', total >= threshold * 100);
    });

    var labels = progress.querySelectorAll('.tp-mlabel, .tp-prog-label');
    if (labels[0]) labels[0].classList.toggle('is-unlocked', total >= freeCents);
    if (labels[1]) labels[1].classList.toggle('is-unlocked', total >= discountCents);
    if (labels[2]) labels[2].classList.toggle('is-unlocked', total >= maxCents);
  }

  function syncCart(cart) {
    updateCount(cart);
    updateTotal(cart);
    updateProgress(cart);
    updateSavings(cart);
    watchSubtotal();

    document.dispatchEvent(new CustomEvent('theme:cart:change', {
      detail: { cart: cart },
      bubbles: true
    }));

    var drawerUpdates = [];
    document.dispatchEvent(new CustomEvent('theme:cart:reload', {
      bubbles: true,
      detail: { waitUntil: function (update) { drawerUpdates.push(update); } }
    }));
    return Promise.all(drawerUpdates);
  }

  function isCartPage() {
    return document.body.classList.contains('template-cart') || /\/cart\/?$/.test(window.location.pathname);
  }

  function openDrawer() {
    if (isCartPage()) return;

    var drawer = document.getElementById('drawer-cart');
    if (!drawer || drawer.classList.contains('is-open')) return;

    // Hide WhatsApp widget when cart drawer is active
    document.body.classList.add('is-drawer-open');
    var wa = document.querySelector('.tp-whatsapp-sticky');
    if (wa) wa.style.display = 'none';

    // Dispatch native theme event
    drawer.dispatchEvent(new CustomEvent('theme:drawer:open', { bubbles: true }));

    // Fallback direct class updates
    drawer.classList.remove('display-none');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('drawer--visible', 'is-open');

    document.querySelectorAll(cartToggles).forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'true');
    });

    var drawerScrolls = drawer.querySelector('[data-drawer-scrolls]');
    document.dispatchEvent(new CustomEvent('theme:scroll:lock', {
      bubbles: true,
      detail: drawerScrolls
    }));

    if (window.theme && window.theme.state) {
      window.theme.state.cartOpen = true;
    }

    var closeBtn = drawer.querySelector('.drawer__close, [data-first-focus]');
    if (closeBtn) {
      setTimeout(function () {
        closeBtn.focus();
      }, 100);
    }
  }

  function closeDrawer() {
    var drawer = document.getElementById('drawer-cart');
    if (!drawer) return;

    document.body.classList.remove('is-drawer-open');
    var wa = document.querySelector('.tp-whatsapp-sticky');
    if (wa) wa.style.display = '';

    drawer.dispatchEvent(new CustomEvent('theme:drawer:close', { bubbles: true }));
    drawer.classList.remove('drawer--visible', 'is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('inert', '');

    document.querySelectorAll(cartToggles).forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
    });

    var drawerScrolls = drawer.querySelector('[data-drawer-scrolls]');
    if (drawerScrolls) {
      drawerScrolls.dispatchEvent(new CustomEvent('theme:scroll:unlock', { bubbles: true }));
    }
    document.dispatchEvent(new CustomEvent('theme:scroll:unlock', { bubbles: true }));

    if (window.theme && window.theme.state) {
      window.theme.state.cartOpen = false;
    }

    setTimeout(function () {
      if (!drawer.classList.contains('drawer--visible')) {
        drawer.classList.add('display-none');
      }
    }, 400);
  }

  function clearAllButtonLoaders() {
    document.querySelectorAll('.btn--add-to-cart, [data-add-to-cart], button[name="add"], .add-cart-button-singale-variant, .add-to-cart-button-for-product-card, .tp-perf-card__atc-btn').forEach(function (btn) {
      btn.classList.remove('loading', 'is-loading');
      if (btn.disabled && !btn.hasAttribute('data-initially-disabled')) {
        btn.disabled = false;
      }
    });
  }

  window.tpRefreshCartDrawer = function (options) {
    options = options || {};
    var refresh = ++latestRefresh;

    var cartPromise;
    if (options.cart) {
      cartPromise = Promise.resolve(options.cart);
    } else {
      cartPromise = fetchCart();
    }

    return cartPromise
      .then(function (cart) {
        if (refresh !== latestRefresh) return cart;

        return syncCart(cart).then(function () {
          if (refresh === latestRefresh && options.open !== false) openDrawer();
          clearAllButtonLoaders();
          return cart;
        });
      })
      .catch(function (error) {
        console.error('tpRefreshCartDrawer error:', error);
        clearAllButtonLoaders();
        return null;
      });
  };

  function scheduleRefresh(options) {
    if (refreshDebounceTimer) clearTimeout(refreshDebounceTimer);
    refreshDebounceTimer = setTimeout(function () {
      refreshDebounceTimer = null;
      window.tpRefreshCartDrawer(options);
    }, 60);
  }

  /* ── GLOBAL FETCH INTERCEPTOR FOR ADD TO CART ── */
  var origFetch = window.fetch;
  window.fetch = function () {
    var args = arguments;
    var url = args[0];
    var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    var isCartAdd = urlStr && urlStr.indexOf('/cart/add') !== -1;

    var result = origFetch.apply(this, args);

    if (isCartAdd) {
      result.then(function (res) {
        if (res && res.ok) {
          scheduleRefresh({ open: true });
        }
      }).catch(function () {});
    }

    return result;
  };

  /* ── GLOBAL XHR INTERCEPTOR FOR ADD TO CART ── */
  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._tpUrl = url;
    return origXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var self = this;
    if (self._tpUrl && typeof self._tpUrl === 'string' && self._tpUrl.indexOf('/cart/add') !== -1) {
      self.addEventListener('load', function () {
        if (self.status >= 200 && self.status < 300) {
          scheduleRefresh({ open: true });
        }
      });
    }
    return origXHRSend.apply(this, arguments);
  };

  /* ── FORM SUBMIT LISTENER FOR NATIVE /CART/ADD FORMS ── */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.action || form.action.indexOf('/cart/add') === -1) return;

    var submitBtn = form.querySelector('[type="submit"], [name="add"], .btn--add-to-cart, [data-add-to-cart]');
    if (submitBtn) {
      submitBtn.classList.add('loading', 'is-loading');
    }

    if (!form.hasAttribute('data-ajax-handled')) {
      e.preventDefault();
      var formData = new FormData(form);
      var addUrl = form.action.indexOf('.js') !== -1 ? form.action : (getRoot() + 'cart/add.js');

      fetch(addUrl, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Add to cart failed');
          return res.json();
        })
        .then(function () {
          window.tpRefreshCartDrawer({ open: true });
        })
        .catch(function (err) {
          console.error(err);
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.classList.remove('loading', 'is-loading');
            submitBtn.disabled = false;
          }
          clearAllButtonLoaders();
        });
    }
  }, true);

  /* ── THEME EVENTS ── */
  document.addEventListener('theme:cart:change', function (event) {
    var cart = event.detail && event.detail.cart;
    if (!cart) return;
    updateCount(cart);
    updateTotal(cart);
    updateProgress(cart);
    updateSavings(cart);
    clearAllButtonLoaders();
  });

  document.addEventListener('theme:cart:added', function (event) {
    var detail = event.detail || {};
    scheduleRefresh({
      cart: detail.cart,
      open: detail.open !== false
    });
    clearAllButtonLoaders();
  });

  /* ── UPSELL ADD TO CART CLICK HANDLER ── */
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-tp-upsell-add]');
    if (!button || button.disabled || button.classList.contains('is-loading')) return;

    event.preventDefault();

    var variantId = Number(button.dataset.variantId);
    if (!variantId) return;

    var label = button.querySelector('.tp-upsell-add-label');
    button.disabled = true;
    button.classList.add('is-loading');

    var addUrl = (window.theme && window.theme.routes && window.theme.routes.cart ? window.theme.routes.cart : getRoot() + 'cart') + '/add.js';

    fetch(addUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (error) {
            throw error;
          });
        }
        return response.json();
      })
      .then(function () {
        return window.tpRefreshCartDrawer({ open: true });
      })
      .catch(function (error) {
        console.error(error);
        if (label) {
          var previous = label.textContent;
          label.textContent = 'Retry';
          setTimeout(function () {
            label.textContent = previous;
          }, 2000);
        }
      })
      .finally(function () {
        button.disabled = false;
        button.classList.remove('is-loading');
      });
  });

  /* ── SEE DETAILS ACCORDION TOGGLE ── */
  document.addEventListener('click', function (event) {
    var detailsBtn = event.target.closest('.tp-footer-details-link');
    if (!detailsBtn) return;

    event.preventDefault();
    var dropdown = document.getElementById('accordion-price-details');
    if (!dropdown) return;

    var isOpen = dropdown.style.display !== 'none';
    dropdown.style.display = isOpen ? 'none' : 'block';
    detailsBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  /* ── ORDER NOTES ACCORDION TOGGLE ── */
  document.addEventListener('click', function (event) {
    var accordionTrigger = event.target.closest('#drawer-cart [data-accordion-trigger="accordion-cart-notes"]');
    if (!accordionTrigger) return;

    event.preventDefault();
    var isExpanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
    var nextState = !isExpanded;
    accordionTrigger.setAttribute('aria-expanded', String(nextState));

    var body = document.getElementById('accordion-cart-notes');
    if (body) {
      if (nextState) {
        body.style.display = 'block';
        body.classList.add('is-open');
        var textarea = body.querySelector('textarea');
        if (textarea) textarea.focus();
      } else {
        body.style.display = 'none';
        body.classList.remove('is-open');
      }
    }
  });

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-mobile-cart-trigger]');
    if (!trigger || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isCartPage() || !document.getElementById('drawer-cart')) return;

    event.preventDefault();
    openDrawer();
  });

  /* ── CLOSE / UNDERLAY CLICK DELEGATION ── */
  document.addEventListener('click', function (event) {
    var closeBtn = event.target.closest('#drawer-cart .drawer__close, #drawer-cart [data-drawer-toggle="drawer-cart"]');
    var underlay = event.target.closest('#drawer-cart [data-drawer-underlay]');

    if (closeBtn || underlay) {
      event.preventDefault();
      closeDrawer();
    }
  });

  /* ── ESCAPE KEY CLOSE ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var drawer = document.getElementById('drawer-cart');
      if (drawer && (drawer.classList.contains('drawer--visible') || drawer.classList.contains('is-open'))) {
        closeDrawer();
      }
    }
  });

  /* ── INITIALIZE ON DOM READY ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      fetchCart().then(function (cart) {
        updateCount(cart);
        updateTotal(cart);
        updateProgress(cart);
        updateSavings(cart);
        watchSubtotal();
      }).catch(function () {});
    });
  } else {
    fetchCart().then(function (cart) {
      updateCount(cart);
      updateTotal(cart);
      updateProgress(cart);
      updateSavings(cart);
    }).catch(function () {});
  }
})();
