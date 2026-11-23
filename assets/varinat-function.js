class DynamicCard extends HTMLElement {
  constructor() {
    super();
    this.addTocartButton = this.querySelector('button[add-to-cart]');
    this.cart =
      document.querySelector('cart-notification') ||
      document.querySelector('cart-drawer');
    
    // Bind event listeners
    this.addEventListener('change', this.onVariantChange.bind(this));
    this.addEventListener('input', this.onVariantChange.bind(this));
    this.addEventListener('click', (e) => {
      if (e.target && e.target.closest('.variant-radio-input')) {
        this.onVariantChange();
      }
    });
    this.addTocartButton?.addEventListener('click', this.addTocart.bind(this));
    this.select = this.querySelector('select[select]');
    this.querySelector('.select-wrapper')?.addEventListener('click', this.handleClickSelect.bind(this));
  }
  connectedCallback() {
    const fieldsets = this.querySelectorAll('fieldset');
    fieldsets.forEach((fieldset) => {
      const checkedInput = fieldset.querySelector('input:checked');
      if (!checkedInput) {
        const firstInput = fieldset.querySelector('input');
        if (firstInput) firstInput.checked = true;
      }
    });
    this.getCurrentSelectedOptions();
    this.updateSelectedStyles();
  }


  handleClickSelect() {
    this.select?.click();
  }

  onVariantChange() {
    this.getCurrentSelectedOptions();
    this.getcurrentVariant();
    this.updateForm();
    this.updateSelectedStyles();  // Update the label background color
    this.toggleAddTocart();
    this.updatePrice();  // Update the price when the variant changes
    this.updateImage();  // Update the variant image
  }

  updateImage() {
    var mainImg = this.querySelector('.tp-perf-card__image:not(.tp-perf-card__image--hover)');
    if (!mainImg) return;
    if (this.currentVariant && this.currentVariant.image) {
      mainImg.src = this.currentVariant.image;
      mainImg.srcset = '';
    } else {
      var defaultSrc = mainImg.getAttribute('data-default-src');
      var defaultSrcset = mainImg.getAttribute('data-default-srcset');
      if (defaultSrc) {
        mainImg.src = defaultSrc;
        if (defaultSrcset) mainImg.srcset = defaultSrcset;
      }
    }
  }

  toggleAddTocart() {
    if (this.currentVariant) {
      this.addTocartButton?.removeAttribute('disabled');
    } else {
      this.addTocartButton?.setAttribute('disabled', '');
    }
  }

  getCurrentSelectedOptions() {
    this.currentOptions = [];
    const fields = this.querySelectorAll('fieldset');

    fields.forEach((selector) => {
      const selected = selector.querySelector('input:checked') || selector.querySelector('[checked]');
      this.currentOptions.push(selected ? selected.value : null);
    });
    // console.log(this.currentOptions, "<==== current selected options ====>");
    return this.currentOptions;
  }

  getVariantsData() {
    if (this._variantsData) return this._variantsData;

    const jsonData = this.querySelector('script[data-product-variants]') || this.querySelector('[type="application/json"]');
    this._variantsData = jsonData ? JSON.parse(jsonData.textContent) : [];
    return this._variantsData;
  }

  getcurrentVariant() {
    this.currentVariant = this.getVariantsData().find((variant) =>
      variant.options.every((option, index) => this.currentOptions[index] === option)
    );
  }

  updateSelectedStyles() {
    const variantGroups = this.querySelectorAll('input');
    variantGroups.forEach((input) => {
      const optionLabel = input.nextElementSibling;
      if (optionLabel) optionLabel.style.background = '';
    });
  }
  

  updateForm() {
    this.formData = {
      items: [],
    };

    if (this.currentVariant) {
      this.formData.items.push({ id: this.currentVariant.id, quantity: 1 });
    }
  }

  addTocart() {
    if (!this.formData.items.length) {
      console.error('No items to add to cart.');
      return;
    }

    fetch(`${window.Shopify.routes.root}cart/add.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(() => {
        if (typeof window.tpRefreshCartDrawer === 'function') {
          window.tpRefreshCartDrawer({ open: true });
        } else {
          document.dispatchEvent(new CustomEvent('theme:cart:reload', { bubbles: true }));
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('Failed to add to cart. Please try again.');
      });
  }


  updatePrice() {
  const priceElement = this.querySelector('.variant-price-wrapper');
  if (this.currentVariant && priceElement) {
    const currentPrice = Math.round(this.currentVariant.price / 100);
    const compareAtPrice = Math.round(this.currentVariant.compare_at_price / 100);

    // Calculate offer percentage
    let offerHTML = '';
    if (compareAtPrice > currentPrice) {
      const discount = compareAtPrice - currentPrice;
      const discountPercentage = Math.round((discount / compareAtPrice) * 100);
      offerHTML = `<span class="offer-percentage">${discountPercentage}% OFF</span>`;
    }

    // Final HTML
    const currentPriceHTML = `<span class="current-price">₹${currentPrice}</span>`;
    const compareAtPriceHTML = compareAtPrice > currentPrice
      ? `<span class="compare-at-price">₹${compareAtPrice}</span>`
      : '';

    priceElement.innerHTML = currentPriceHTML + compareAtPriceHTML + offerHTML;
  }
}

  
  
}

if (!customElements.get('dynamic-card')) {
  customElements.define('dynamic-card', DynamicCard);
}

// ── Global Performance Card Controller (Variants, Price & Quantity) ──
(function() {
  if (window.tpPerfCardGlobalInit) return;
  window.tpPerfCardGlobalInit = true;

  function formatMoney(cents){
    var rupees = cents / 100;
    if (rupees % 1 === 0) return '₹' + rupees;
    var s = rupees.toFixed(2).replace(/\.00$/, '');
    return '₹' + s;
  }

  function handleVariantUpdate(target) {
    if (target && target.classList.contains('tp-perf-card__radio-input')) {
      var card = target.closest('dynamic-card, .tp-perf-card');
      if (!card) return;
      var variantId = target.getAttribute('data-variant-id');
      var hiddenInput = card.querySelector('.tp-perf-card__hidden-id');
      var atcBtn = card.querySelector('.tp-perf-card__atc-btn');
      if (hiddenInput && variantId) hiddenInput.value = variantId;
      if (atcBtn && variantId) atcBtn.setAttribute('data-selected-value-data-value', variantId);

      // Update variant image in product card
      var mainImg = card.querySelector('.tp-perf-card__image:not(.tp-perf-card__image--hover)');
      if (mainImg) {
        var vImg = target.getAttribute('data-variant-image');
        var vSrcset = target.getAttribute('data-variant-image-srcset');
        if (vImg) {
          mainImg.src = vImg;
          if (vSrcset) mainImg.srcset = vSrcset;
          else mainImg.srcset = '';
        } else {
          var defaultSrc = mainImg.getAttribute('data-default-src');
          var defaultSrcset = mainImg.getAttribute('data-default-srcset');
          if (defaultSrc) {
            mainImg.src = defaultSrc;
            if (defaultSrcset) mainImg.srcset = defaultSrcset;
          }
        }
      }

      // Update price row from variants JSON
      try {
        var jsonEl = card.querySelector('script[data-product-variants]');
        if (!jsonEl) return;
        var variants = JSON.parse(jsonEl.textContent);
        var v = null;
        for (var i = 0; i < variants.length; i++) {
          if (String(variants[i].id) === String(variantId)) { v = variants[i]; break; }
        }
        if (!v) return;
        var curEl = card.querySelector('[data-tp-current]');
        var compEl = card.querySelector('[data-tp-compare]');
        var discEl = card.querySelector('[data-tp-discount]');
        var saveEl = card.querySelector('[data-tp-save]');
        var unitEl = card.querySelector('[data-tp-unit]');
        if (curEl) curEl.textContent = formatMoney(v.price);
        if (compEl) {
          if (v.compare_at_price && v.compare_at_price > v.price) {
            compEl.textContent = formatMoney(v.compare_at_price);
            compEl.style.display = '';
          } else {
            compEl.textContent = '';
            compEl.style.display = 'none';
          }
        }
        if (saveEl) {
          if (v.compare_at_price && v.compare_at_price > v.price) {
            var saveAmt = v.compare_at_price - v.price;
            saveEl.textContent = 'Save ' + formatMoney(saveAmt);
            saveEl.style.display = '';
          } else {
            saveEl.textContent = '';
            saveEl.style.display = 'none';
          }
        }
        if (discEl) {
          if (v.compare_at_price && v.compare_at_price > v.price) {
            var disc = Math.round((v.compare_at_price - v.price) * 100 / v.compare_at_price);
            discEl.textContent = disc + '% off';
            discEl.style.display = '';
          } else {
            discEl.style.display = 'none';
          }
        }
        if (unitEl) {
          if (v.unit_price) {
            var unit = v.unit_price_measurement ? v.unit_price_measurement.reference_unit : 'unit';
            unitEl.textContent = formatMoney(v.unit_price) + '/' + unit;
            unitEl.style.display = '';
          } else {
            unitEl.style.display = 'none';
          }
        }
      } catch(e){}
    }
  }

  document.addEventListener('change', function(e) {
    handleVariantUpdate(e.target);
  });
  document.addEventListener('input', function(e) {
    handleVariantUpdate(e.target);
  });
  document.addEventListener('mouseover', function(e) {
    var pill = e.target.closest('.tp-perf-card__variants-grid');
    if (pill) {
      var card = pill.closest('.tp-perf-card, dynamic-card');
      if (card) card.classList.add('tp-variant-hovered');
    }
  });
  document.addEventListener('mouseout', function(e) {
    var pill = e.target.closest('.tp-perf-card__variants-grid');
    if (pill) {
      var card = pill.closest('.tp-perf-card, dynamic-card');
      if (card && !pill.contains(e.relatedTarget)) card.classList.remove('tp-variant-hovered');
    }
  });

  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('tp-perf-card__radio-input')) {
      handleVariantUpdate(e.target);
    }
    var qBtn = e.target.closest('[data-qty-minus], [data-qty-plus]');
    if (qBtn) {
      var card = qBtn.closest('dynamic-card, .tp-perf-card');
      if (!card) return;
      var display = card.querySelector('[data-qty-display]');
      var form = card.querySelector('form');
      var qtyInput = form ? form.querySelector('input[name="quantity"]') : null;
      if (!qtyInput && form) {
        qtyInput = document.createElement('input');
        qtyInput.type = 'hidden';
        qtyInput.name = 'quantity';
        qtyInput.value = '1';
        form.appendChild(qtyInput);
      }
      var cur = parseInt(display ? display.textContent : '1', 10) || 1;
      if (qBtn.hasAttribute('data-qty-plus')) cur++;
      else cur = Math.max(1, cur - 1);
      if (display) display.textContent = cur;
      if (qtyInput) qtyInput.value = cur;
    }
  });
})();
