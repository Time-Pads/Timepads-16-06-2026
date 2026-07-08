/**
 * Image Error Handling & Performance Monitoring
 * Handles failed image loads gracefully on slow networks (4G)
 */

(function() {
  'use strict';

  /**
   * Image Error Handler
   * Provides fallback handling for failed image loads
   */
  function initImageErrorHandling() {
    document.addEventListener('error', function(e) {
      if (e.target.tagName !== 'IMG') return;
      
      const img = e.target;
      const fallbackSrc = img.getAttribute('data-img-error');
      
      // Track the error
      if (window.dataLayer) {
        window.dataLayer.push({
          'event': 'image_load_error',
          'image_src': img.src,
          'has_fallback': !!fallbackSrc
        });
      }
      
      // Try fallback if available and not already used
      if (fallbackSrc && img.src !== fallbackSrc) {
        console.warn('Image failed to load, trying fallback:', fallbackSrc);
        img.src = fallbackSrc;
        img.classList.add('image-error-fallback');
      } else {
        // No fallback available, show error state
        img.classList.add('image-error-failed');
        img.style.opacity = '0.5';
        console.error('Image failed to load permanently:', img.src);
      }
    }, true);
  }

  /**
   * Image Loading Performance Monitoring
   * Tracks image load times to identify slow images
   */
  function initImagePerformanceMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === 'img' && entry.duration > 500) {
            // Slow image detected — only log in local development
            var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (isLocalDev) {
              console.warn('Slow image load detected:', {
                name: entry.name,
                duration: Math.round(entry.duration) + 'ms',
                size: entry.transferSize ? (entry.transferSize / 1024).toFixed(2) + 'KB' : 'unknown'
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Image performance monitoring not available:', e.message);
    }
  }

  /**
   * Fix for images without width/height attributes
   * Logs warnings for accessibility and CLS issues
   */
  function checkImageDimensions() {
    const images = document.querySelectorAll('img');
    const issues = [];

    images.forEach((img) => {
      if (!img.width || !img.height) {
        // Skip if we're in a picture element (parent will have dimensions)
        const parent = img.parentElement;
        if (parent && parent.tagName === 'PICTURE') return;
        
        issues.push({
          src: img.src.substring(0, 50),
          alt: img.alt || 'no alt text'
        });
      }
    });

    var isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (issues.length > 0 && isLocalDev) {
      console.warn('Images without dimensions (may cause CLS):', issues);
    }
  }

  /**
   * Preload images that will be immediately visible
   * For critical above-the-fold images
   */
  function preloadCriticalImages() {
    const images = document.querySelectorAll('img[fetchpriority="high"]');
    const preloadedUrls = new Set();

    images.forEach((img) => {
      if (img.src && !preloadedUrls.has(img.src)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        if (img.srcset) {
          link.imagesrcset = img.srcset;
        }
        if (img.sizes) {
          link.imagesizes = img.sizes;
        }
        document.head.appendChild(link);
        preloadedUrls.add(img.src);
      }
    });
  }

  /**
   * Lazy loading observer for images marked with data-src
   * Fallback for browsers that don't support native lazy loading
   */
  function initLazyLoadingFallback() {
    if (!('IntersectionObserver' in window)) return;

    const images = document.querySelectorAll('img[data-src]:not([src])');
    if (images.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach((img) => observer.observe(img));
  }

  /**
   * Initialize all image optimization features
   */
  function init() {
    // Run immediately
    initImageErrorHandling();
    initImagePerformanceMonitoring();
    checkImageDimensions();

    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        preloadCriticalImages();
        initLazyLoadingFallback();
      });
    } else {
      preloadCriticalImages();
      initLazyLoadingFallback();
    }

    // Re-check lazy loading on dynamic content
    if ('MutationObserver' in window) {
      const mutationObserver = new MutationObserver(() => {
        initLazyLoadingFallback();
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globals for debugging
  if (process.env.NODE_ENV !== 'production') {
    window.imageOptimization = {
      checkImageDimensions,
      init
    };
  }
})();
