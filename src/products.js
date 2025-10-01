import products from './products.json'; // Product data

// Generate product cards
function generateProducts() {
    const productsContainer = document.querySelector('#products .products__items');

    products.forEach((product) => {
        const productCard = document.createElement('div');
        productCard.className = 'products__items__item';
        // productCard.onclick = () => openProductModal(product);

        productCard.innerHTML = `
            <div class="products__items__item__img">
                <img src="${product.image}" alt="${product.name}">
                <div class="products__items__item__img__label">${product.category}</div>
            </div>
            <div class="products__items__item__info">
                <h3 class="products__items__item__info__title">${product.name}</h3>
                <p class="products__items__item__info__description">${product.description}</p>
                <div class="products__items__item__info__characteristics">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                    d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z">
                    </path>
                    <path d="M12 22V12"></path>
                    <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"></path>
                    <path d="m7.5 4.27 9 5.15"></path>
                </svg>
                <span class="products__items__item__info__characteristics__part">${product.weight}</span>
                </div>
                <button class="products__items__item__info__cta-details custom-btn-1">
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
    });
}

export default generateProducts();