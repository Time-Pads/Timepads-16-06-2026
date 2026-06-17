class DynamicCard extends HTMLElement {
  constructor() {
    super();
    this.addTocartButton = this.querySelector('button[add-to-cart]');
    this.cart =
      document.querySelector('cart-notification') ||
      document.querySelector('cart-drawer');
    
    // Bind event listeners
    this.addEventListener('change', this.onVariantChange.bind(this));
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
      if (input.checked) {
        input.nextElementSibling.style.background = "";  // Corrected here
      } else {
        input.nextElementSibling.style.background = "";
      }
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

customElements.define('dynamic-card', DynamicCard);
