const footerContainer = document.querySelector('.footer.lazy-background');
const lazyBackgrounds = document.querySelectorAll('.lazy-background');
const footerSentinel = document.querySelector('.footer-sentinel');
// const lazyImages = document.querySelectorAll('.lazy-loading');


export function lazyloading() {
    const productLazyImages = document.querySelectorAll('.lazy-loading');

    lazyBackgrounds.forEach(laziBg => !laziBg.classList.contains('footer') && BGImgObserver.observe(laziBg));
    BGImgObserver.observe(footerSentinel);

    productLazyImages.forEach(laziImg => productImgObserver.observe(laziImg));


}

const BGImgObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.className === 'footer-sentinel') {
                footerContainer.classList.remove('lazy-background');
            } else {
                entry.target.classList.remove('lazy-background');
            }
            observer.unobserve(entry.target);
        }
    }
    );
}, {
    rootMargin: '200px 0px',
    threshold: 0.01
});

const productImgObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let productImage = entry.target;
            productImage.classList.remove('lazy-loading');
            productImage.src = productImage.dataset.src;
            observer.unobserve(productImage);
        }
    });
}, {
    threshold: 0.05,
    rootMargin: "0px"
});