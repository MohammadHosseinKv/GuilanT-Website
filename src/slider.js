import { lockScroll, unlockScroll } from "./main";

// Slider functionality
export class productSlider {
    constructor(productSlides, productSlideTrack, productPrevBtn, productNextBtn, productSliderElement, productSlideInterval) {
        this.slides = productSlides;
        this.slideTrack = productSlideTrack;
        this.prevBtn = productPrevBtn;
        this.nextBtn = productNextBtn;
        this.sliderElement = productSliderElement;
        this.slideIndex = 0;
        this.intervalId = null;
        this.slideInterval = productSlideInterval;
        this.init();
    }

    init() {
        if (this.slides.length > 0) {
            this.updateSlidePosition();
            this.prevBtn.addEventListener('click', () => this.prevSlide());
            this.nextBtn.addEventListener('click', () => this.nextSlide());

            // Add hover event listeners
            this.sliderElement.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.sliderElement.addEventListener('mouseleave', () => this.startAutoSlide());

            // Check if we have only one image
            if (this.slides.length === 1) {
                this.sliderElement.classList.add('single-image');
            } else {
                this.startAutoSlide();
            }
        }
    }

    updateSlidePosition() {
        this.slideTrack.style.transform = `translateX(-${this.slideIndex * 100}%)`;
    }

    prevSlide() {
        if (this.slides.length <= 1) return;

        this.pauseAutoSlide();

        this.slideIndex <= 0 ? this.slideIndex = this.slides.length - 1 : this.slideIndex--;

        this.updateSlidePosition();
        this.startAutoSlide();
    }

    nextSlide() {
        if (this.slides.length <= 1) return;

        this.pauseAutoSlide();

        this.slideIndex >= this.slides.length - 1 ? this.slideIndex = 0 : this.slideIndex++;

        this.updateSlidePosition();
        this.startAutoSlide();
    }

    startAutoSlide() {
        if (this.slides.length <= 1) return;

        // Clear any existing interval
        this.pauseAutoSlide();

        // Start new interval
        this.intervalId = setInterval(() => this.nextSlide(), this.slideInterval);
    }

    pauseAutoSlide() { clearInterval(this.intervalId); }

}


export class productModalSlider {
    constructor(productSlides, productSlideTrack, productPrevBtn, productNextBtn, productSliderElement, productSlideInterval = 4000) {
        this.slides = productSlides;
        this.slideTrack = productSlideTrack;
        this.prevBtn = productPrevBtn;
        this.nextBtn = productNextBtn;
        this.sliderElement = productSliderElement;
        this.navContainer = productSliderElement.querySelector('.modal__slider-nav');
        this.slideIndex = 0;
        this.intervalId = null;
        this.slideInterval = productSlideInterval;
        this.init();
    }

    init() {
        if (this.slides.length > 0) {
            // Set initial position
            this.updateSlidePosition();

            this.createNavigation();
            this.prevBtn.addEventListener('click', () => this.prevSlide());
            this.nextBtn.addEventListener('click', () => this.nextSlide());
            this.setupZoomEffect();
            this.setupClickToFullscreen();

            // Add hover event listeners
            this.sliderElement.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.sliderElement.addEventListener('mouseleave', () => this.startAutoSlide());

            // Add keyboard navigation when slider is focused
            this.sliderElement.setAttribute('tabindex', '0');
            this.sliderElement.addEventListener('keydown', (e) => this.handleKeyDown(e));

            // Check if we have only one image
            if (this.slides.length === 1) {
                this.sliderElement.classList.add('single-image');
            } else {
                this.startAutoSlide();
            }
        }
    }

    createNavigation() {
        // Clear existing navigation
        this.navContainer.innerHTML = '';

        // Create navigation items for each slide
        this.slides.forEach((slide, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'modal__slider-nav__item';
            if (index === 0) navItem.classList.add('active');

            const img = document.createElement('img');
            img.src = slide.src;
            img.alt = `Thumbnail ${index + 1}`;

            navItem.appendChild(img);
            navItem.addEventListener('click', () => this.goToSlide(index));

            this.navContainer.appendChild(navItem);
        });
    }

    updateSlidePosition() {
        this.slideTrack.style.transform = `translateX(-${this.slideIndex * 100}%)`;

        // Update active navigation item
        if (this.navContainer) {
            const navItems = this.navContainer.querySelectorAll('.modal__slider-nav__item');
            navItems.forEach((item, index) => {
                if (index === this.slideIndex) item.classList.add('active');
                else item.classList.remove('active');
                
            });
        }
    }

    goToSlide(index) {
        if (this.slides.length <= 1) return;

        this.pauseAutoSlide();
        this.slideIndex = index;
        this.updateSlidePosition();
        this.startAutoSlide();
    }

    prevSlide() {
        if (this.slides.length <= 1) return;

        this.pauseAutoSlide();
        this.slideIndex--;
        if (this.slideIndex < 0) {
            this.slideIndex = this.slides.length - 1;
        }
        this.updateSlidePosition();
        this.startAutoSlide();
    }

    nextSlide() {
        if (this.slides.length <= 1) return;

        this.pauseAutoSlide();
        this.slideIndex++;
        if (this.slideIndex >= this.slides.length) {
            this.slideIndex = 0;
        }
        this.updateSlidePosition();
        this.startAutoSlide();
    }

    startAutoSlide() {
        if (this.slides.length <= 1) return;

        // Clear any existing interval
        this.pauseAutoSlide();

        // Start new interval
        this.intervalId = setInterval(() => this.nextSlide(), this.slideInterval);
    }

    pauseAutoSlide() {
        clearInterval(this.intervalId);
    }

    setupZoomEffect() {
        this.slides.forEach(slide => {
            slide.addEventListener('mousemove', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const xPercent = (x / rect.width) * 100;
                const yPercent = (y / rect.height) * 100;

                this.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                this.style.transform = 'scale(1.5)';
            });

            slide.addEventListener('mouseleave', function () {
                this.style.transform = 'scale(1)';
                this.style.transformOrigin = 'center center';
            });
        });
    }

    setupClickToFullscreen() {
        this.slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                this.openFullscreen(index);
            });
        });
    }

    openFullscreen(index) {
        const modal = document.getElementById('fullscreenModal');
        const fullscreenSlideTrack = document.getElementById('fullscreenSlideTrack');
        const fullscreenNav = document.getElementById('fullscreenNav');

        lockScroll();

        // Clear existing fullscreen content
        fullscreenSlideTrack.innerHTML = '';
        fullscreenNav.innerHTML = '';

        // Create fullscreen slides
        this.slides.forEach((slide, i) => {
            const fullscreenSlide = document.createElement('img');
            fullscreenSlide.className = 'fullscreen-slide';
            fullscreenSlide.src = slide.src;
            fullscreenSlide.alt = slide.alt;
            fullscreenSlideTrack.appendChild(fullscreenSlide);

            // Create fullscreen navigation items
            const navItem = document.createElement('div');
            navItem.className = 'fullscreen-nav-item';
            if (i === index) {
                navItem.classList.add('active');
            }

            const img = document.createElement('img');
            img.src = slide.src;
            img.alt = `Thumbnail ${i + 1}`;

            navItem.appendChild(img);
            navItem.addEventListener('click', () => {
                fullscreenSlider.goToSlide(i);
            });

            fullscreenNav.appendChild(navItem);
        });

        // Initialize fullscreen slider
        const fullscreenSlider = new FullscreenSlider(
            fullscreenSlideTrack.querySelectorAll('.fullscreen-slide'),
            fullscreenSlideTrack,
            document.querySelector('.fullscreen-prev'),
            document.querySelector('.fullscreen-next'),
            document.querySelector('.fullscreen-slider'),
            index
        );

        // Show modal
        modal.classList.add('active');
        modal.removeAttribute('inert');
        modal.setAttribute('aria-hidden', 'false');

        // Close modal when clicking on background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFullscreen();
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFullscreen();
            }
        });

        // Close modal with close button
        document.getElementById('fullscreenClose').addEventListener('click', () => {
            this.closeFullscreen();
        });
    }

    closeFullscreen() {
        const modal = document.getElementById('fullscreenModal');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
        unlockScroll();
    }

    handleKeyDown(e) {
        // Only handle keyboard events if slider has focus
        if (document.activeElement !== this.sliderElement) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
        }
    }
}

class FullscreenSlider {
    constructor(slides, slideTrack, prevBtn, nextBtn, sliderElement, startIndex = 0) {
        this.slides = slides;
        this.slideTrack = slideTrack;
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        this.sliderElement = sliderElement;
        this.navContainer = document.getElementById('fullscreenNav');
        this.slideIndex = startIndex;
        this.init();
    }

    init() {
        if (this.slides.length > 0) {
            // Set initial position
            this.updateSlidePosition();

            this.prevBtn.addEventListener('click', () => this.prevSlide());
            this.nextBtn.addEventListener('click', () => this.nextSlide());

            // Add keyboard navigation for fullscreen slider
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
    }

    updateSlidePosition() {
        this.slideTrack.style.transform = `translateX(-${this.slideIndex * 100}%)`;

        // Update active navigation item
        if (this.navContainer) {
            const navItems = this.navContainer.querySelectorAll('.fullscreen-nav-item');
            navItems.forEach((item, index) => {
                if (index === this.slideIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    goToSlide(index) {
        if (this.slides.length <= 1) return;

        this.slideIndex = index;
        this.updateSlidePosition();
    }

    prevSlide() {
        if (this.slides.length <= 1) return;

        this.slideIndex--;
        if (this.slideIndex < 0) {
            this.slideIndex = this.slides.length - 1;
        }
        this.updateSlidePosition();
    }

    nextSlide() {
        if (this.slides.length <= 1) return;

        this.slideIndex++;
        if (this.slideIndex >= this.slides.length) {
            this.slideIndex = 0;
        }
        this.updateSlidePosition();
    }

    handleKeyDown(e) {
        // Only handle keyboard events if modal is active
        const modal = document.getElementById('fullscreenModal');
        if (!modal.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
        }
    }
}