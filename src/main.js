import '../styles/modern-normalize.css';
import '../styles/style.css';
import '../styles/components/header.css';
import '../styles/components/hero.css';
import '../styles/components/whyus.css';
import '../styles/components/products.css';
import '../styles/utils.css';

const scrollToTopBtn = document.querySelector('.scroll-top');


// throttle scroll with rAF for performance
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const scrolled = window.scrollY > 50; // your threshold
    if (scrolled) showBtn(scrollToTopBtn); else hideBtn(scrollToTopBtn);
    ticking = false;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeScrollToTop();
});

function initializeScrollToTop(){
  // initial state: hidden from keyboard
  if (scrollToTopBtn) {
    scrollToTopBtn.setAttribute('aria-hidden', 'true');
    scrollToTopBtn.setAttribute('tabindex', '-1');
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // click handler (respect reduced motion)
  scrollToTopBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) window.scrollTo(0, 0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollToTopBtn.blur();
  });
}

function showBtn(Btn) {
    if (!Btn.classList.contains('visible')) {
        Btn.classList.add('visible');
        Btn.setAttribute('aria-hidden', 'false');
        Btn.removeAttribute('tabindex'); // allow tabbing
    }
}

function hideBtn(Btn) {
    if (Btn.classList.contains('visible')) {
        Btn.classList.remove('visible');
        Btn.setAttribute('aria-hidden', 'true');
        Btn.setAttribute('tabindex', '-1'); // remove from tab order
        Btn.blur(); // remove focus if user was focused on it
    }
}