import { productModalSlider, productSlider } from "./slider";
import { lockScroll, unlockScroll } from "./main";
import { clearProductSkeletons, showProductSkeletons } from "./skeletons";
import { showToast } from "./toast";

const PRODUCTS_CACHE_KEY = "products_json_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PRODUCTS_CDN_URL = "https://res.cloudinary.com/dxjjr0dte/raw/upload/tea-site-data/products.json";


// Modal helpers
const modalRootSelector = '#product-modal';
const modalContentSelector = '.custom-modal__content';
const modalBackdropSelector = '[data-modal-backdrop]';
const modalCloseSelector = '[data-modal-close]';

// Slider helpers
const productSliderElementSelector = '.product-slider';
const productSlidesContainerSelector = '.product-slides-container';
const productSlideTrackSelector = '.product-slide-track';
const productSlideSelector = '.product-slide';
const productPrevBtnSelector = '.product-prev';
const productNextBtnSelector = '.product-next';

const productModalSliderElementSelector = '.modal__slider';
const productModalSlidesContainerSelector = '.modal__slides-container';
const productModalSlideTrackSelector = '.modal__slide-track';
const productModalSlideSelector = '.modal__slide';
const productModalPrevBtnSelector = '.modal__slides-prev';
const productModalNextBtnSelector = '.modal__slides-next';


const productSingleImageSelector = '.single-image';

/* ---------- SEO helpers (minimal, uses only existing product fields) ---------- */

/** Build small keyword phrase for a product (simple, deduped) */
function buildKeywordsForProduct(product, max = 12) {
  const set = new Set();
  const push = (v) => {
    if (!v) return;
    // v may be string or array
    if (Array.isArray(v)) v.forEach(item => push(item));
    else {
      v.toString().split(/\s+/).forEach(tok => {
        const t = tok.toLowerCase().replace(/[^\u0600-\u06FF\w\-]+/g, '').trim(); // keep Persian/latin/num/dash
        if (t && t.length > 1) set.add(t);
      });
    }
  };

  push(product.name);
  push(product.category);
  push(product.features);
  push(product.characteristics);
  push(product.weight);
  // price is numeric — include as string if present
  if (product.price != null) set.add(String(product.price));
  return Array.from(set).slice(0, max).join(', ');
}

/** Update page-level meta[name="keywords"] with aggregated product keywords */
function updateGlobalKeywords(products) {
  try {
    const agg = new Set();
    (products || []).forEach(p => {
      if (!p || !p.visible) return;
      buildKeywordsForProduct(p, 20).split(',').map(s => s.trim()).forEach(s => { if (s) agg.add(s); });
    });
    const kws = Array.from(agg).slice(0, 50).join(', ');
    let meta = document.head.querySelector('meta[name="keywords"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'keywords');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', kws);
  } catch (e) { console.warn('updateGlobalKeywords error', e); }
}

/** Attach a minimal, hidden microdata block into each product card (only existing fields) */
function attachStructuredDataToCard(product, cardEl) {
  if (!cardEl || !product) return;
  if (cardEl.querySelector('.sr-only.product-structured')) return; // already attached

  const wrapper = document.createElement('div');
  wrapper.className = 'sr-only product-structured';
  wrapper.setAttribute('itemscope', '');
  wrapper.setAttribute('itemtype', 'https://schema.org/Product');

  const name = document.createElement('span');
  name.setAttribute('itemprop', 'name');
  name.textContent = product.name || '';
  wrapper.appendChild(name);

  const desc = document.createElement('span');
  desc.setAttribute('itemprop', 'description');
  desc.textContent = product.description || '';
  wrapper.appendChild(desc);

  const cat = document.createElement('span');
  cat.setAttribute('itemprop', 'category');
  cat.textContent = product.category || '';
  wrapper.appendChild(cat);

  if (product.price != null) {
    const offers = document.createElement('div');
    offers.setAttribute('itemprop', 'offers');
    offers.setAttribute('itemscope', '');
    offers.setAttribute('itemtype', 'https://schema.org/Offer');

    const price = document.createElement('meta');
    price.setAttribute('itemprop', 'price');
    price.content = String(product.price);
    offers.appendChild(price);

    // currency not present in your JSON — use IRR as fallback (no visible effect)
    const currency = document.createElement('meta');
    currency.setAttribute('itemprop', 'priceCurrency');
    currency.content = 'IRR';
    offers.appendChild(currency);

    wrapper.appendChild(offers);
  }

  // features and characteristics: concatenate into readable text
  const extra = [];
  if (Array.isArray(product.features) && product.features.length) extra.push(`ویژگی‌ها: ${product.features.join(', ')}`);
  if (product.characteristics) {
    if (Array.isArray(product.characteristics) && product.characteristics.length) extra.push(`مشخصات: ${product.characteristics.join(', ')}`);
    else if (typeof product.characteristics === 'string' && product.characteristics.trim()) extra.push(`مشخصات: ${product.characteristics}`);
  }
  if (extra.length) {
    const more = document.createElement('span');
    more.setAttribute('itemprop', 'additionalProperty');
    more.textContent = extra.join(' • ');
    wrapper.appendChild(more);
  }

  cardEl.appendChild(wrapper);
}

/** Build one JSON-LD script for all visible products (minimal fields only) and inject into <head> */
function injectJsonLdForAllProducts(products) {
  try {
    const graph = (products || [])
      .filter(p => p && p.visible)
      .map(p => {
        const obj = {
          "@type": "Product",
          "name": p.name,
          "description": p.description || '',
          "image": Array.isArray(p.image) ? p.image : (p.image ? [p.image] : []),
          "category": p.category || '',
        };
        if (p.price != null) obj.offers = { "@type": "Offer", "price": String(p.price), "priceCurrency": "IRR" };
        return obj;
      });

    if (!graph.length) return;
    // create or replace single script with id 'ld-products'
    let script = document.head.querySelector('#ld-products');
    const payload = { "@context": "https://schema.org", "@graph": graph };
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'ld-products';
      script.textContent = JSON.stringify(payload, null, 2);
      document.head.appendChild(script);
    } else {
      script.textContent = JSON.stringify(payload, null, 2);
    }
  } catch (e) { console.warn('injectJsonLdForAllProducts error', e); }
}

/** Load Products from CDN product json and cache data */
export async function loadProducts() {
  const productsContainer = document.querySelector('#products .product__items');
  try {
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    const now = Date.now();

    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.ts && (now - parsed.ts) < CACHE_TTL_MS && parsed.data) {
        console.log("Using cached products");
        generateProducts(parsed.data);
        return;
      }
    }

    if (productsContainer) showProductSkeletons(productsContainer, 6);

    console.log("Fetching fresh products.json from CDN...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const response = await fetch(PRODUCTS_CDN_URL, { cache: "no-cache", signal: controller.signal });
    clearTimeout(timeout)
      ;
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const products = await response.json();

    // Save to localStorage with timestamp
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({
      ts: now,
      data: products
    }));

    if (productsContainer) clearProductSkeletons(productsContainer);

    generateProducts(products);

    return;

  } catch (err) {
    console.error("Failed to load products:", err);
    if (productsContainer) {
      productsContainer.innerHTML = `<div class="load-error">مشکلی در بارگذاری محصولات به وجود آمد. <button id="retry-products" class="custom-btn-1">تلاش مجدد</button></div>`;
      const retryBtn = document.getElementById('retry-products');
      retryBtn?.addEventListener('click', () => loadProducts());
      showToast({ title: "خطا در اتصال", message: "بارگذاری اطلاعات محصولات ناموفق بود.", type: 'error', duration: 5000 });

    }
  }
}


export async function refreshProducts() {
  localStorage.removeItem(PRODUCTS_CACHE_KEY);
  return await loadProducts();
}

// Generate product cards
export function generateProducts(products) {
  const productsContainer = document.querySelector('#products .product__items');
  if (!productsContainer) {
    console.warn('generateProducts: #products .product__items not found in DOM.');
    return;
  }

  productsContainer.innerHTML = '';

  if (!Array.isArray(products) || products.length === 0) {
    console.warn('generateProducts: products.json is empty or not an array.');
    return;
  }

  products.forEach((product) => {
    if (!product.visible) return;
    const productCard = document.createElement('div');
    productCard.className = 'product__item';
    /* <div class="product__item__img">
                <img src="${product.image}" alt="${product.name}">
                <div class="product__item__img__label">${product.category}</div>
            </div>
    */
    productCard.innerHTML = `
            <div class="product__item__img">
                <div class="product__item__img__label">${product.category}</div>
                <div class="product-slider">
                  <div class="product-slides-container">
                    <div class="product-slide-track">
                      ${product.image.map(img => `
                      <img class="product-slide lazy-loading" loading='lazy' src="" data-src="${img}" alt="${product.name}">
                      `).join('')}
                    </div>
                  </div>
                  <button class="product-prev"><span>&#10095;</span></button>
                  <button class="product-next"><span>&#10094;</span></button>
                </div>
            </div>
            <div class="product__item__info">
                <h3 class="product__item__info__title">${product.name}</h3>
                <p class="product__item__info__description">${product.description}</p>
                <div class="product__item__info__characteristics">
                  <div aria-label="package-icon" class="product__item__info__weight">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path
                        d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z">
                        </path>
                        <path d="M12 22V12"></path>
                        <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path>
                        <path d="m7.5 4.27 9 5.15"></path>
                    </svg>
                    <span class="product__item__info__weight__title">${product.weight}</span>
                  </div>
                  <div class="product__item__info__price">
                  <span class="product__item__info__price__title" dir="ltr">${new Intl.NumberFormat("fa-IR", { maximumSignificantDigits: 3 }).format(
      product.price)}</span>
                  <span class="product__item__info__price__unit">تومان</span>
                  </div>
                </div>
                <button aria-label="eye-icon, show product details, open product modal" class="product__item__info__cta-details custom-btn-1" type="button" data-id="${product.id}" data-title="${product.name}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                    d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0">
                    </path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                مشاهده جزئیات
                </button>
    `;

    productsContainer.appendChild(productCard);
    new productSlider(productCard.querySelectorAll(productSlideSelector)
      , productCard.querySelector(productSlideTrackSelector)
      , productCard.querySelector(productPrevBtnSelector)
      , productCard.querySelector(productNextBtnSelector)
      , productCard.querySelector(productSliderElementSelector)
      , 4000);

    const openModalBtn = productCard.querySelector('.product__item__info__cta-details');
    openModalBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      openProductModal(product);
    });

    attachStructuredDataToCard(product, productCard);
  });

  // once: update keywords meta and inject one JSON-LD block for all visible products
  updateGlobalKeywords(products);
  injectJsonLdForAllProducts(products);

}

export function openProductModal(product) {
  const modal = document.querySelector(modalRootSelector);
  const modalContent = document.querySelector(modalContentSelector);
  if (!modal) {
    console.warn('openProductModal: ' + modalRootSelector + ' not found.');
    return;
  }
  modal.setAttribute('aria-labelledby', product.name);

  // fill modal content
  const productModalCloseBtn = document.createElement('button');
  productModalCloseBtn.classList = 'custom-modal__close';
  productModalCloseBtn.type = 'button';
  productModalCloseBtn.setAttribute('aria-label', 'Close dialog');
  productModalCloseBtn.setAttribute('data-modal-close', '');
  productModalCloseBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M18 6 6 18"></path>
           <path d="m6 6 12 12"></path>
         </svg>
  `;
  // <button class="custom-modal__close" data-modal-close type="button" aria-label="Close dialog">
  //       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  //         <path d="M18 6 6 18"></path>
  //         <path d="m6 6 12 12"></path>
  //       </svg>
  //     </button>
  const productModalImageSection = document.createElement('div');
  productModalImageSection.className = 'modal__image__section';
  const featsSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>`
  productModalImageSection.innerHTML = `
        <div class="modal__slider">
          <div class="modal__slides-container">
            <div class="modal__slide-track">
              ${product.image.map(img => `
                    <img class="modal__slide" loading='lazy' src="${img}" alt="${product.name}">
                `).join('')}
            </div>
            <button class="modal__slides-prev"><span>&#10094;</span></button>
            <button class="modal__slides-next"><span>&#10095;</span></button>
          </div>

          <div class="modal__slider-nav">

          </div>
        </div>
        `;

  const productModalDetailsSection = document.createElement('div');
  productModalDetailsSection.className = 'modal__product__details';
  productModalDetailsSection.innerHTML = `
        <h3 class="modal__product-title">${product.name}</h4>
          <p class="modal__product-desc">
            ${product.description}
          </p>
          <div class="modal__product-category-weight">
            <p class="modal__product-category">دسته بندی: <span>${product.category}</span></p>
            <p class="modal__product-weight">وزن: <span>${product.weight}</span></p>
          </div>
          <div class="modal__product-feats-chars__grid">
            <div class="modal__product-chars__section">
              <strong class="modal__product-chars-title">مشخصات</strong>
              <div class="modal__product-chars">
                ${product.characteristics.length == 0 ?
      'مشخصاتی برای این محصول ثبت نشده است.' :
      product.characteristics.map(chr => `
                              <div class="modal__product-characteristic">• ${chr}</div>
                `).join('')}
              </div>
            </div>
            <div class="modal__product-feats__section">
              <strong class="modal__product-feats-title">ویژگی ها</strong>
              <div class="modal__product-feats">
              ${product.features.length == 0 ?
      'برای این محصول ویژگی ای ثبت نشده است.' :
      product.features.map(feature => `
                              <div aria-label="circle-checkmark-icon, product feature" class="modal__product-feature">
                              ${featsSvg}
                              ${feature}
                              </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="modal__price-cta">
            <a aria-label="tel-icon, contact to order" href="#contact" data-modal-close class="modal__product-contact custom-btn-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path
                  d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384">
                </path>
              </svg>
              <span>تماس برای سفارش</span>
            </a>
            <h4 class="modal__product-price">${new Intl.NumberFormat("fa-IR", { maximumSignificantDigits: 3 }).format(
        product.price)} تومان</h4>
          </div>
        `;

  lockScroll();
  modalContent.setAttribute('aria-label', `${product.name} modal`);
  modalContent.appendChild(productModalCloseBtn);
  modalContent.appendChild(productModalImageSection);
  new productModalSlider(productModalImageSection.querySelectorAll(productModalSlideSelector)
    , productModalImageSection.querySelector(productModalSlideTrackSelector)
    , productModalImageSection.querySelector(productModalPrevBtnSelector)
    , productModalImageSection.querySelector(productModalNextBtnSelector)
    , productModalImageSection.querySelector(productModalSliderElementSelector)
    , 4000);
  modalContent.appendChild(productModalDetailsSection);
  initModalBehavior();
  modal.classList.add('open');
  modalContent.classList.add('fadeInDown-animation', 'animation');
  modal.setAttribute('aria-hidden', 'false');
  modal.removeAttribute('inert');
  // put focus inside modal content (first focusable element or content wrapper)
  const content = modal.querySelector(modalContentSelector);
  // try to focus first focusable element
  const firstFocusable = findFocusable(content) || content;
  try { firstFocusable.focus(); } catch (e) { }

}

export function closeProductModal() {
  const modal = document.querySelector(modalRootSelector);
  if (!modal) {
    console.warn('closeProductModal: ' + modalRootSelector + ' not found.');
    return;
  }
  const modalContent = document.querySelector(modalContentSelector);
  unlockScroll();
  modal.classList.remove('open');
  modalContent.classList.remove('fadeInDown-animation', 'animation');
  modalContent.textContent = '';
  // document.querySelector('.modal__image__section').remove();
  // document.querySelector('.modal__product__details').remove();
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('inert', '');
}

/* Focusable helpers */
function findFocusable(root) {
  if (!root) return null;
  const focusables = root.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return focusables.length ? focusables[0] : null;
}

function handleFocusTrap(e) {
  const modal = document.querySelector(modalRootSelector);
  if (!modal || !modal.classList.contains('open')) return;

  const content = modal.querySelector(modalContentSelector);
  const focusable = Array.from(content.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => el.offsetParent !== null); // visible only

  if (focusable.length === 0) {
    // if nothing focusable, keep focus on content container
    if (document.activeElement !== content) content.focus();
    if (e.key === 'Tab') e.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!e.shiftKey && e.target === last && e.key === 'Tab') {
    // Tab on last -> move to first
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && e.target === first && e.key === 'Tab') {
    // Shift+Tab on first -> move to last
    e.preventDefault();
    last.focus();
  }
}

/* Initialize modal behaviour: click handlers, ESC, backdrop, focus-trap */
export function initModalBehavior() {
  const modal = document.querySelector(modalRootSelector);
  if (!modal) return;

  // close buttons
  modal.querySelectorAll(modalCloseSelector).forEach(btn =>
    btn.addEventListener('click', () => closeProductModal())
  );

  // backdrop click: close when clicking on backdrop element
  const backdrop = modal.querySelector(modalBackdropSelector);
  if (backdrop) {
    backdrop.addEventListener('click', () => closeProductModal());
  } else {
    // fallback: clicking on modal root but outside content closes it
    modal.addEventListener('click', (e) => {
      const content = modal.querySelector(modalContentSelector);
      if (e.target === modal) closeProductModal();
      // or if click outside content (if modal root contains more than backdrop)
      if (content && !content.contains(e.target)) closeProductModal();
    });
  }

  // ESC key to close + focus trap on Tab
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeProductModal();
    } else if (e.key === 'Tab') {
      handleFocusTrap(e);
    }
  });

  // mark aria-hidden and inert initially
  if (modal.classList.contains('open')) {
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
  } else {
    modal.setAttribute('aria-hidden', 'false');
    if (modal.hasAttribute('inert')) modal.removeAttribute('inert');
  }

}

export default {
  generateProducts,
  openProductModal,
  initModalBehavior,
  loadProducts,
  refreshProducts
};