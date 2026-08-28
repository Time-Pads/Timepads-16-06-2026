const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to live site...');
  await page.goto('https://timepads.in', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));

  // Programmatically add a product to the cart using fetch
  console.log('Adding product to cart via Shopify AJAX...');
  const addResult = await page.evaluate(async () => {
    try {
      // Fetch some product data or add a known default variant ID
      // Let's first fetch /products/period-pain-relief-cream.js to get its first variant ID dynamically
      const prodRes = await fetch('/products/period-pain-relief-cream.js');
      const prodData = await prodRes.json();
      const variantId = prodData.variants[0].id;
      
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Add to cart result:', addResult);

  // Reload the page to initialize cart drawer with items
  console.log('Reloading page...');
  await page.goto('https://timepads.in', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 4000));

  // Click cart icon to open the drawer
  console.log('Opening cart drawer...');
  try {
    await page.click('a[data-drawer-toggle="drawer-cart"]');
  } catch (e) {
    console.log('Click cart toggle failed, checking DOM directly...');
  }
  await new Promise(r => setTimeout(r, 2000));

  // Extract all img tags inside the cart drawer
  const results = await page.evaluate(() => {
    const drawer = document.querySelector('#drawer-cart');
    if (!drawer) return { error: 'Cart drawer element #drawer-cart not found' };

    const imgs = Array.from(drawer.querySelectorAll('img'));
    
    // Find empty src images
    const emptySrcImgs = imgs.filter(img => {
      const srcAttr = img.getAttribute('src');
      return !srcAttr || srcAttr.trim() === '' || srcAttr === window.location.href || img.src === window.location.href;
    });

    return {
      imgCount: imgs.length,
      allImgs: imgs.map(img => ({
        outerHTML: img.outerHTML,
        srcAttr: img.getAttribute('src'),
        srcResolved: img.src
      })),
      emptyImagesCount: emptySrcImgs.length,
      emptyImages: emptySrcImgs.map(img => ({
        outerHTML: img.outerHTML,
        srcAttr: img.getAttribute('src'),
        srcResolved: img.src
      }))
    };
  });

  console.log('Cart Drawer Images Audit:', JSON.stringify(results, null, 2));
  await browser.close();
})();
