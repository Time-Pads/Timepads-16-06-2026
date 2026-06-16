/*
* Pipeline Theme
*
* Use this file to add custom Javascript to Pipeline.  Keeping your custom
* Javascript in this fill will make it easier to update Pipeline. In order
* to use this file you will need to open layout/theme.liquid and uncomment
* the custom.js script import line near the bottom of the file.
*
*/


(function() {
  // Keep custom theme hooks lightweight in production.
})();

// Share and Quick View logic removed

(function() {
  const CARD_SELECTOR = '[data-card-preview-images]';
  const ARROW_SELECTOR = '[data-card-preview-arrow]';
  const timerMap = new WeakMap();
  const preloadMap = new Map();
  const desktopQuery = window.matchMedia('(min-width: 769px)');
  const mobileQuery = window.matchMedia('(max-width: 768px)');

  function parseImages(card) {
    try {
      const images = JSON.parse(card.getAttribute('data-card-preview-images') || '[]');
      return Array.isArray(images) ? images.filter(Boolean).slice(0, 4) : [];
    } catch (error) {
      return [];
    }
  }

  function getActiveImage(card) {
    return card.querySelector('[data-grid-current-image] img, .product-grid-item__image-wrapper.is-active img, .main-image');
  }

  function ensureCardState(card) {
    const image = getActiveImage(card);
    if (!image) return null;

    if (!card.dataset.cardPreviewDefault) {
      card.dataset.cardPreviewDefault = card.getAttribute('data-card-preview-default') || image.currentSrc || image.src || '';
    }

    if (!card.dataset.cardPreviewDefaultSrcset) {
      card.dataset.cardPreviewDefaultSrcset = image.getAttribute('srcset') || '';
    }

    if (!card.dataset.cardPreviewDefaultSizes) {
      card.dataset.cardPreviewDefaultSizes = image.getAttribute('sizes') || '';
    }

    if (!card.dataset.cardPreviewIndex) {
      card.dataset.cardPreviewIndex = '0';
    }

    if (!card.dataset.cardPreviewCurrent) {
      card.dataset.cardPreviewCurrent = card.dataset.cardPreviewDefault;
    }

    return image;
  }

  function preloadImage(src, callback) {
    if (!src) {
      callback();
      return;
    }

    if (preloadMap.has(src)) {
      const status = preloadMap.get(src);
      if (status === 'loaded' || status === 'error') {
        callback();
        return;
      }
    }

    const loader = new Image();
    preloadMap.set(src, 'loading');
    loader.decoding = 'async';
    loader.onload = () => {
      preloadMap.set(src, 'loaded');
      callback();
    };
    loader.onerror = () => {
      preloadMap.set(src, 'error');
      callback();
    };
    loader.src = src;
  }

  function updateImage(card, index) {
    const images = parseImages(card);
    const image = ensureCardState(card);
    if (!image || images.length === 0) return;

    const boundedIndex = Math.max(0, Math.min(index, images.length - 1));
    const nextSrc = images[boundedIndex];
    if (!nextSrc) return;

    image.classList.add('is-preview-fading');
    preloadImage(nextSrc, () => {
      image.src = nextSrc;
      image.srcset = `${nextSrc} 300w`;
      image.sizes = '300px';
      card.dataset.cardPreviewIndex = String(boundedIndex);
      card.dataset.cardPreviewCurrent = nextSrc;
      requestAnimationFrame(() => {
        image.classList.remove('is-preview-fading');
      });
    });
  }

  function resetImage(card) {
    const image = ensureCardState(card);
    if (!image) return;

    image.classList.add('is-preview-fading');
    image.src = card.dataset.cardPreviewDefault;

    if (card.dataset.cardPreviewDefaultSrcset) {
      image.setAttribute('srcset', card.dataset.cardPreviewDefaultSrcset);
    } else {
      image.removeAttribute('srcset');
    }

    if (card.dataset.cardPreviewDefaultSizes) {
      image.setAttribute('sizes', card.dataset.cardPreviewDefaultSizes);
    } else {
      image.removeAttribute('sizes');
    }

    card.dataset.cardPreviewIndex = '0';
    card.dataset.cardPreviewCurrent = card.dataset.cardPreviewDefault;

    requestAnimationFrame(() => {
      image.classList.remove('is-preview-fading');
    });
  }

  function stopPreview(card, shouldReset) {
    const timer = timerMap.get(card);
    if (timer) {
      window.clearInterval(timer);
      timerMap.delete(card);
    }

    if (shouldReset) {
      resetImage(card);
    }
  }

  function startPreview(card) {
    if (!desktopQuery.matches) return;

    const images = parseImages(card);
    if (images.length < 2) return;

    ensureCardState(card);
    stopPreview(card, false);
    updateImage(card, 1);

    const timer = window.setInterval(() => {
      const currentIndex = Number(card.dataset.cardPreviewIndex || '0');
      const nextIndex = currentIndex >= images.length - 1 ? 1 : currentIndex + 1;
      updateImage(card, nextIndex);
    }, 1000);

    timerMap.set(card, timer);
  }

  function handleArrowClick(button) {
    if (!mobileQuery.matches) return;

    const card = button.closest(CARD_SELECTOR);
    if (!card) return;

    const images = parseImages(card);
    if (images.length < 2) return;

    ensureCardState(card);
    stopPreview(card, false);

    const currentIndex = Number(card.dataset.cardPreviewIndex || '0');
    const direction = button.getAttribute('data-card-preview-arrow') === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + direction + images.length) % images.length;
    updateImage(card, nextIndex);
  }

  document.addEventListener('mouseenter', (event) => {
    const card = event.target.closest(CARD_SELECTOR);
    if (!card) return;
    if (event.relatedTarget instanceof Element && card.contains(event.relatedTarget)) return;
    startPreview(card);
  }, true);

  document.addEventListener('mouseleave', (event) => {
    const card = event.target.closest(CARD_SELECTOR);
    if (!card) return;
    if (event.relatedTarget instanceof Element && card.contains(event.relatedTarget)) return;
    stopPreview(card, true);
  }, true);

  document.addEventListener('click', (event) => {
    const arrow = event.target.closest(ARROW_SELECTOR);
    if (!arrow) return;
    event.preventDefault();
    event.stopPropagation();
    handleArrowClick(arrow);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      stopPreview(card, true);
    });
  });
})();

(function () {
  function onPageShowEvents(event) {
    // Only refresh cart state when the page is restored from browser cache.
    if (!event || !event.persisted) return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initCartEvent, { timeout: 500 })
    } else {
      initCartEvent()
    }
    function initCartEvent(){
      window.fetch(window.theme.routes.cart + '.js')
      .then((response) => {
        if(!response.ok){
          throw {status: response.statusText};
        }
        return response.json();
      })
      .then((response) => {
        document.dispatchEvent(new CustomEvent('theme:cart:change', {
          detail: {
            cart: response,
          },
          bubbles: true,
        }));
        return response;
      })
      .catch((e) => {
        console.error(e);
      });
    }
  };
  window.addEventListener('pageshow', onPageShowEvents);
})();


// Product Image Zoom (Desktop Hover + Mobile Double Tap)
document.addEventListener('DOMContentLoaded', () => {
  let lastTap = 0;
  let lastTapTarget = null;
  const isMobile = () => window.innerWidth < 768;

  // Safely resets zoom anywhere it was applied
  const resetAllZoom = () => {
    document.querySelectorAll('.product__media.zoomed, .product__media.is-hover-zoomed').forEach(container => {
      container.classList.remove('zoomed', 'is-hover-zoomed');
      const img = container.querySelector('img');
      
      if (img) {
        img.style.transform = 'scale(1)'; // Triggers CSS transition out
        setTimeout(() => {
          if (!container.classList.contains('is-hover-zoomed') && !container.classList.contains('zoomed')) {
            img.style.transformOrigin = 'center center';
            img.style.transform = '';
          }
        }, 300);
      }
      
      // Re-enable flickity swiping
      const slider = container.closest('.flickity-enabled');
      if (slider && window.Flickity) {
        const flkty = window.Flickity.data(slider);
        if (flkty) {
          flkty.options.draggable = true;
          flkty.updateDraggable();
        }
      }
    });
  };

  // 1. Mobile Double Tap (touchend) via Delegation
  document.addEventListener('touchend', (e) => {
    if (!isMobile()) return;
    
    const container = e.target.closest('.product__media');
    if (!container) return;
    
    const img = container.querySelector('img');
    if (!img) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0 && lastTapTarget === img) {
      e.preventDefault(); // Prevent browser zoom
      
      const isZoomed = container.classList.contains('zoomed');
      
      if (!isZoomed) {
        resetAllZoom(); // Clear others
        container.classList.add('zoomed');
        
        // Focus zoom on tap location
        const rect = container.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
        
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        img.style.transform = 'scale(2.5)';
        
        // Disable flickity swipe to allow panning inside zoomed image
        const slider = container.closest('.flickity-enabled');
        if (slider && window.Flickity) {
          const flkty = window.Flickity.data(slider);
          if (flkty) {
            flkty.options.draggable = false;
            flkty.updateDraggable();
          }
        }
      } else {
        resetAllZoom();
      }
    }
    
    lastTap = currentTime;
    lastTapTarget = img;
  }, { passive: false });

  // Block accidental clicks when zoomed
  document.addEventListener('click', (e) => {
    if (!isMobile()) return;
    const container = e.target.closest('.product__media');
    if (container && container.classList.contains('zoomed')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // 2. Desktop Hover Zoom (mousemove & mouseout) via Delegation
  document.addEventListener('mousemove', (e) => {
    if (isMobile()) return;
    
    const container = e.target.closest('.product-single .product__media');
    if (!container) return;
    
    const img = container.querySelector('img');
    if (!img) return;
    
    container.classList.add('is-hover-zoomed');

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    img.style.transform = 'scale(1.6)';
    container.style.cursor = 'zoom-in';
  });

  document.addEventListener('mouseout', (e) => {
    if (isMobile()) return;
    
    const container = e.target.closest('.product-single .product__media');
    if (!container) return;
    
    if (e.relatedTarget && container.contains(e.relatedTarget)) return;

    container.classList.remove('is-hover-zoomed');
    const img = container.querySelector('img');
    if (!img) return;

    img.style.transform = 'scale(1)';
    setTimeout(() => { 
      if (!container.classList.contains('is-hover-zoomed')) {
        img.style.transformOrigin = 'center center'; 
      }
    }, 300);
  });

  // 3. Reset Zoom whenever theme changes slides or variants
  document.addEventListener('theme:product:media-change', resetAllZoom);
  document.addEventListener('theme:variant:change', resetAllZoom);
});


function searchFunction() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const contentElements = document.querySelectorAll("#content h2, #content p");
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = ""; // Clear previous results
  if (searchInput.length === 0) {
      resultsContainer.style.display = "none";
      return;
  }

  contentElements.forEach((element) => {
      const text = element.textContent || element.innerText;
      if (text.toLowerCase().includes(searchInput)) {
          const li = document.createElement("li");
          li.textContent = text;
          li.onclick = () => {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
          };
          resultsContainer.appendChild(li);
      }
  });
  resultsContainer.style.display = resultsContainer.children.length > 0 ? "block" : "none";
}

// Mobile share logic removed


// document.querySelectorAll('.add-to-cart-button-for-product-card').forEach(button => {
// button.addEventListener('click', (event) => {
//   const productCard = event.target.closest('.product-grid-item__container');
//   const popup = productCard.querySelector('.popup-message');
//   const BodyBackgroundChange = document.querySelector('.bg-body-color-gif-opens');
//   BodyBackgroundChange.style.position = "fixed";
//   BodyBackgroundChange.style.background = "#0000001f";
//   BodyBackgroundChange.style.width = "100%";
//   BodyBackgroundChange.style.height = "100%";
//   popup.classList.add('show');
//   console.log(popup,"=====>")
//   setTimeout(() => {
//     popup.classList.remove('show');
//     BodyBackgroundChange.style.position = "";
//   BodyBackgroundChange.style.background = "";
//   BodyBackgroundChange.style.width = "";
//   BodyBackgroundChange.style.height = "";
//   }, 3000);
// });
// });
document.querySelectorAll('.add-cart-button-singale-variant').forEach(button => {
button.addEventListener('click', (event) => {
  event.preventDefault();
  const productCard = event.target.closest('.product-grid-item__container');
  const popup = productCard.querySelector('.popup-message');
    popup.classList.add('show');
    setTimeout(() => {
      popup.classList.remove('show');
     
    }, 3000);
});
});

//// Lazy section

class LazySection extends HTMLElement {
  static sectionsToFetch = [];

  constructor() {
    super();

    this.section = this.closest('section')?.id || this.closest('[id]').id;
    this.section = this.section?.replace('shopify-section-', '');

    this.trigger = this.dataset.triggerEvent || 'intersection-observer';
    this.targetSelector = this.dataset.triggerTarget || 'body';

    this.boundHandleMouseover = this.handleMouseover.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    const targetElement = document.querySelector(this.targetSelector);

    // Different triggers based on data-trigger attribute
    if (this.trigger === 'mouseover') {
      if (screen.width < 990) return;
      
      targetElement.addEventListener('mouseover', this.boundHandleMouseover);
    } else if (this.trigger === 'click') {
      targetElement.addEventListener('click', this.boundHandleClick);
    } else {
      // Default to intersection observer
      new IntersectionObserver(this.handleIntersection.bind(this), { rootMargin: '0px 0px 200px 0px' }).observe(this);
    }
  }

  // Handler for intersection-observer trigger
  handleIntersection(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);

    this.fetchSections();
  }

  // Handler for mouseover trigger
  handleMouseover() {
    // Remove trigger once added to sectionsToFetch
    this.removeTrigger();
    this.fetchSections();
  }

  // Handler for click trigger
  handleClick() {
    // Remove trigger once added to sectionsToFetch
    this.removeTrigger();
    this.fetchSections();
  }

  // Common function for fetching sections
  fetchSections() {
    LazySection.sectionsToFetch.push(this.section);
    const sectionsToFetchBatch = LazySection.sectionsToFetch.length == 5 ? LazySection.sectionsToFetch.splice(0, 5) : LazySection.sectionsToFetch;

      // Check if there is an ongoing network request
    if (LazySection.abortController) {
      LazySection.abortController.abort('Section list updated, cancelling request.');
    }

    LazySection.abortController = sectionsToFetchBatch.length < 5 && new AbortController();

    fetch(window.location.pathname + '?sections=' + sectionsToFetchBatch.join(','), LazySection.abortController.signal ? { signal: LazySection.abortController.signal } : {})
      .then((response) => response.json())
      .then((json) => {
        for (const [key, value] of Object.entries(json)) {
          const sectionContent = new DOMParser().parseFromString(value, 'text/html').getElementById('shopify-section-' + key);

          if (sectionContent && sectionContent.innerHTML.trim().length) {
            const section = document.getElementById('shopify-section-' + key);
            section.innerHTML = sectionContent.innerHTML;

              // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
            section.querySelectorAll('script').forEach((oldScriptTag) => {
              const newScriptTag = document.createElement('script');
              Array.from(oldScriptTag.attributes).forEach((attribute) => {
                newScriptTag.setAttribute(attribute.name, attribute.value);
              });
              newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
              oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
            });
          }
        }

        if (sectionsToFetchBatch.length < 5)
          LazySection.sectionsToFetch = [];
      })
      .catch((e) => {
        console.warn(e);
      });
  }

  // Remove trigger based on data-target attribute
  removeTrigger() {
    const targetElement = document.querySelector(this.targetSelector);

    if (targetElement) {
      targetElement.removeEventListener('mouseover', this.boundHandleMouseover);
      targetElement.removeEventListener('click', this.boundHandleClick);
    }
  }
}

customElements.define('lazy-section', LazySection);






document.querySelectorAll('.add-to-cart-button-for-product-card').forEach(btn => {
  btn.addEventListener('click', function() {

    // Start loader
    this.classList.add('loading');

    const duration = 1000; // 2 seconds
    const start = Date.now();

    // Bubble animation interval
    // const bubbleInterval = setInterval(() => {
    //   if (Date.now() - start > duration) {
    //     clearInterval(bubbleInterval);
    //     return;
    //   }
    //   createBubble(this);
    // }, 80);

    // Stop loader after 2 seconds
    setTimeout(() => {
      this.classList.remove('loading');
    }, duration);
  });
});

function createBubble(button) {
  const bubble = document.createElement("span");
  const rect = button.getBoundingClientRect();

  // random position inside whole button
  const randomX = Math.random() * rect.width;
  const randomY = Math.random() * rect.height;

  bubble.style.left = randomX + "px";
  bubble.style.top = randomY + "px";

  // random sideways movement
  bubble.style.setProperty('--rand-x', Math.random());

  button.appendChild(bubble);

  setTimeout(() => bubble.remove(), 1000);
}








document.querySelectorAll('.add-cart-button-singale-variant').forEach(btn => {

  const observer = new MutationObserver(() => {
    if (btn.classList.contains('loading')) {
      startBubbleAnimation(btn);
    }
  });

  observer.observe(btn, { attributes: true });
});

function startBubbleAnimation(button) {
  const duration = 2000;
  const start = Date.now();

  const bubbleInterval = setInterval(() => {
    if (Date.now() - start > duration) {
      clearInterval(bubbleInterval);
      return;
    }
    createBubble(button);
  }, 80);
}

function createBubble(button) {
  const bubble = document.createElement("span");
  bubble.classList.add("bubble");

  const rect = button.getBoundingClientRect();
  bubble.style.left = Math.random() * rect.width + "px";
  bubble.style.top = Math.random() * rect.height + "px";

  bubble.style.setProperty('--rand-x', Math.random());

  button.appendChild(bubble);

  setTimeout(() => bubble.remove(), 1500);
}



      document.querySelectorAll('.add-to-cart-button-for-product-card').forEach(button => {
  button.addEventListener('click', function () {
    
    const cartIcon = document.querySelector('svg.icon-theme.icon-theme-stroke.icon-set-classic-cart');
    const buttonRect = button.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    // Create flying clone
    const clone = document.createElement('div');
    clone.classList.add('fly-animation-clone');
    document.body.appendChild(clone);

    // Set start position
    clone.style.left = buttonRect.left + buttonRect.width / 2 + "px";
    clone.style.top = buttonRect.top + buttonRect.height / 2 + "px";

    // Delay animation for rendering
    requestAnimationFrame(() => {
      clone.style.transform = `
        translate(${cartRect.left - buttonRect.left}px, ${cartRect.top - buttonRect.top}px)
        scale(0.3)
      `;
      clone.style.opacity = "0";
    });

    // Remove clone after animation
    setTimeout(() => clone.remove(), 900);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(
    'input[data-predictive-search-input="search-popdown-results"]'
  );

  if (!searchInput) return;

  // Texts to rotate
  const placeholders = [
    "Search for Night Pads",
    "Search for Day Pads",
    "Search for Sanitary Pads",
    "Search for Cotton Pads",
    "Search for Regular Pads"
  ];

  let index = 0;

  // Function to update placeholder
  function updatePlaceholder() {
    searchInput.setAttribute("placeholder", placeholders[index]);
    index = (index + 1) % placeholders.length;
  }

  // First text immediately
  updatePlaceholder();

  // Change every 2 seconds
  setInterval(updatePlaceholder, 2000);
});









document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(
    'input[data-predictive-search-input="search-popdown-results"]'
  );

  if (!searchInput) return;

  const placeholders = [
    "Search for Night Pads",
    "Search for Day Pads",
    "Search for Sanitary Pads",
    "Search for Cotton Pads",
    "Search for Regular Pads"
  ];

  let textIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const typingSpeed = 120;  // smooth constant speed
  const pauseTime = 1500;   // wait before deleting or typing next

  function animate() {
    const currentText = placeholders[textIndex];

    if (!deleting) {
      searchInput.placeholder = currentText.slice(0, charIndex++);
    } else {
      searchInput.placeholder = currentText.slice(0, charIndex--);
    }

    if (charIndex === currentText.length) {
      setTimeout(() => (deleting = true), pauseTime);
    }

    if (charIndex === 0 && deleting) {
      deleting = false;
      textIndex = (textIndex + 1) % placeholders.length;
    }

    setTimeout(animate, typingSpeed);
  }

  animate();
});




//bubble animation add to cart
const button = document.querySelector(".add-to-cart-button-for-product-card");

let isAnimating = false;

if (button) {
  button.addEventListener("click", () => {
    if (isAnimating) return; // prevents spam clicking

    isAnimating = true;
    button.classList.add("loading");

    createExplosion(button, 32);

    // reset after animation complete
    setTimeout(() => {
      button.classList.remove("loading");
      isAnimating = false;
    }, 1600);
  });
}






     (function () {
        function removeHomepageArtifacts() {
          if (window.location.pathname !== '/') return;

          const whatmoreBase = document.querySelector('.whatmore-base');
          if (whatmoreBase) {
            whatmoreBase.remove();
          }
        }

          (function () {
            return;
            // Blocklist of script URLs you don't want
            const blocked = [
              'avada-offer-main.min.js',
              '@snowplow/javascript-tracker',
              'avada-offer.js',
              'monorail-edge.shopifysvc.com',
            ];

            // Override script creation
            const originalCreate = document.createElement;
            document.createElement = function (tagName) {
              const el = originalCreate.call(document, tagName);
              if (tagName.toLowerCase() === 'script') {
                Object.defineProperty(el, 'src', {
                  set: function (value) {
                    if (blocked.some((b) => value.includes(b))) {
                      console.warn('Blocked script:', value);
                      return; // Don’t load this script
                    }
                    el.setAttribute('src', value);
                  },
                  get: function () {
                    return el.getAttribute('src');
                  },
                });
              }
              return el;
            };

            // Also block scripts already in DOM before execution
            document.addEventListener('DOMContentLoaded', function () {
              document.querySelectorAll('script').forEach((el) => {
                if (el.src && blocked.some((b) => el.src.includes(b))) {
                  console.warn('Removed preloaded script:', el.src);
                  el.remove();
                }
              });
            });
          })();

        if (document.readyState === 'loading') {
          // The document is still loading, wait for the DOMContentLoaded event
          document.addEventListener('DOMContentLoaded', removeHomepageArtifacts);
        } else {
          // The document has finished loading, execute your code immediately
          removeHomepageArtifacts();
        }
      })();






            (function () {
        return;
        const blockedCSS = ['vendor.css'];

        // Prevent new <link rel="stylesheet"> being loaded
        const originalCreate = document.createElement;
        document.createElement = function (tagName) {
          const el = originalCreate.call(document, tagName);

          if (tagName.toLowerCase() === 'link') {
            const setAttr = el.setAttribute.bind(el);
            el.setAttribute = function (name, value) {
              if (name === 'href' && blockedCSS.some((b) => value.includes(b))) {
                console.warn('⛔ Blocked CSS:', value);
                return; // stop loading vendor.css
              }
              return setAttr(name, value);
            };
          }
          return el;
        };

        // Remove already existing vendor.css if it was injected
        document.addEventListener('DOMContentLoaded', function () {
          document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
            if (el.href && blockedCSS.some((b) => el.href.includes(b))) {
              console.warn('🗑 Removed CSS:', el.href);
              el.remove();
            }
          });
        });
      })();





      document.addEventListener("DOMContentLoaded", function () {

  var min = 10;

  var max = 100;

  var el = document.getElementById("limitedStockCount");



  function updateStock(){

    var num = Math.floor(Math.random() * (max - min + 1)) + min;

    if(el){

      el.style.opacity = 0;

      setTimeout(function(){

        el.textContent = num;

        el.style.opacity = 1;

      }, 300);

    }

  }



  updateStock();

  if (el) {
    setInterval(updateStock, 15000); // change every 15 sec
  }

});
