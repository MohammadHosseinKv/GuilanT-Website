/** create product card skeleton node */
export function createProductCardSkeleton() {
    const card = document.createElement('div');
    card.className = 'product__item skeleton';
    card.innerHTML = `
    <div class="product__item__img">
      <div class="product__item__img__label skeleton-text short"></div>
      <div class="product-slider">
        <div class="product-slides-container">
          <div class="product-slide-track">
            <div class="skeleton-img skeleton"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="product__item__info">
      <h3 class="product__item__info__title"><div class="skeleton skeleton-text long"></div></h3>
      <p class="product__item__info__description"><div class="skeleton skeleton-text mid"></div></p>
      <div class="product__item__info__characteristics">
        <div class="product__item__info__weight"><div class="skeleton skeleton-text short"></div></div>
        <div class="product__item__info__price"><div class="skeleton skeleton-text short"></div></div>
      </div>
      <div style="margin-top:8px;"><div class="skeleton skeleton-text short"></div></div>
    </div>
  `;
    card.setAttribute('aria-hidden', 'true');
    return card;
}

/** insert N product skeletons into container */
export function showProductSkeletons(container, count = 6) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.appendChild(createProductCardSkeleton());
    }
    container.setAttribute('aria-busy', 'true');
    // status text for screen-readers
    let sr = document.getElementById('products-status');
    if (!sr) {
        sr = document.createElement('div');
        sr.id = 'products-status';
        sr.className = 'visually-hidden';
        sr.setAttribute('role', 'status');
        sr.textContent = 'در حال بارگذاری محصولات';
        container.parentElement?.appendChild(sr);
    }
}

/** clear skeletons and mark not busy */
export function clearProductSkeletons(container) {
    if (!container) return;
    container.removeAttribute('aria-busy');
    const sr = document.getElementById('products-status');
    if (sr) sr.textContent = 'محصولات بارگذاری شدند';
    // caller should replace innerHTML with real content (generateProducts does that)
}

export function createContactSkeletonItem() {
    const el = document.createElement('div'); // placeholder (will be replaced by anchors)
    el.className = 'contact__info__item skeleton skeleton-placeholder';
    el.setAttribute('data-skeleton', 'true');
    el.innerHTML = `
    <div class="contact__info__item__info">
      <div class="contact__info__item__img skeleton-circle skeleton" aria-hidden="true"></div>
      <div class="contact__info__item__desc">
        <h4 class="contact__info__item__desc__title"><div class="skeleton-text mid skeleton" aria-hidden="true"></div></h4>
        <p class="contact__info__item__desc__subtitle"><div class="skeleton-text short skeleton" aria-hidden="true"></div></p>
      </div>
    </div>
    <div style="margin-left:auto"><div class="skeleton-text short skeleton" aria-hidden="true"></div></div>
  `;
    el.setAttribute('aria-hidden', 'true');
    return el;
}

/** show skeletons in list + footer/header */
export function showContactSkeletons(listContainer, footerContactsContainer, headerSocialsContainer, mobileNavContainer, count = 4) {
    if (listContainer) {
        listContainer.innerHTML = ''; // replace any prior content (clean)
        for (let i = 0; i < count; i++) {
            listContainer.appendChild(createContactSkeletonItem());
        }
        listContainer.setAttribute('aria-busy', 'true');
        // add status region
        let sr = document.getElementById('contacts-status');
        if (!sr) {
            sr = document.createElement('div');
            sr.id = 'contacts-status';
            sr.className = 'visually-hidden';
            sr.setAttribute('role', 'status');
            sr.textContent = 'در حال بارگذاری اطلاعات تماس';
            listContainer.parentElement?.appendChild(sr);
        }
    }

    function addSmallSkeletons(container, n = 3) {
        if (!container) return;
        container.textContent = ''; // replace
        for (let i = 0; i < n; i++) {
            const s = document.createElement('span');
            s.className = 'skeleton-circle skeleton skeleton-placeholder';
            s.setAttribute('data-skeleton', 'true');
            s.setAttribute('aria-hidden', 'true');
            container.appendChild(s);
        }
    }

    addSmallSkeletons(footerContactsContainer, 4);
    addSmallSkeletons(headerSocialsContainer, 3);
    addSmallSkeletons(mobileNavContainer, 3);
}

/** clear skeletons from containers (remove tagged placeholders) */
export function clearContactSkeletons(listContainer, footerContactsContainer, headerSocialsContainer, mobileNavContainer) {
    const removeSkeletonsFrom = (container) => {
        if (!container) return;
        // remove any children that have data-skeleton="true"
        const placeholders = container.querySelectorAll('[data-skeleton="true"]');
        placeholders.forEach(el => el.remove());
        // If container now empty, leave it empty (generateContacts will populate)
    };

    removeSkeletonsFrom(listContainer);
    removeSkeletonsFrom(footerContactsContainer);
    removeSkeletonsFrom(headerSocialsContainer);
    removeSkeletonsFrom(mobileNavContainer);

    if (listContainer) {
        listContainer.removeAttribute('aria-busy');
        const sr = document.getElementById('contacts-status');
        if (sr) sr.textContent = 'اطلاعات تماس بارگیری شد';
    }
}