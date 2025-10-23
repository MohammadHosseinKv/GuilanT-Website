// import '../styles/modern-normalize.css';
// import '../styles/style.css';
// import '../styles/components/header.css';
// import '../styles/components/hero.css';
import '../styles/components/about.css';
import '../styles/components/whyus.css';
import '../styles/components/products.css';
import '../styles/components/contact.css';
import '../styles/components/footer.css';
// import '../styles/components/mobile-nav.css';
// import '../styles/components/modal.css';
import '../styles/components/toast.css';
// import '../styles/utils.css';
import { generateProducts, loadProducts, refreshProducts } from './products';
import { generateContacts, loadContacts, refreshContacts } from './contacts';
import { initializeForm } from './form';
import { initializeMobileNavbar } from './mobileNav';
import { initializeTheme } from './themeController';

const scrollToTopBtn = document.querySelector('.scroll-top');

document.addEventListener('DOMContentLoaded', async () => {
  // initializeTheme();
  initializeScrollToTop();
  initializeMobileNavbar();
  await loadProducts();
  await loadContacts();
  initializeForm();
});

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


function initializeScrollToTop() {
  // initial state: hidden from keyboard
  if (scrollToTopBtn) {
    scrollToTopBtn.setAttribute('aria-hidden', 'true');
    scrollToTopBtn.setAttribute('inert', '');
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
    Btn.removeAttribute('inert');
    Btn.removeAttribute('tabindex'); // allow tabbing
  }
}

function hideBtn(Btn) {
  if (Btn.classList.contains('visible')) {
    Btn.classList.remove('visible');
    Btn.setAttribute('aria-hidden', 'true');
    Btn.setAttribute('inert', '');
    Btn.setAttribute('tabindex', '-1'); // remove from tab order
    Btn.blur(); // remove focus if user was focused on it
  }
}

// Get all sections and nav links
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll("header nav a");
const mobileNavLinks = document.querySelectorAll('.mobile-nav__link');

// Function to detect current section
function setActiveLink() {
  let current = "";

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });

  mobileNavLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

// Listen for scroll
window.addEventListener("scroll", setActiveLink);

const header = document.querySelector('.header');
const footer = document.querySelector('.footer');
const main = document.querySelector('.main-content');
const footerSentinel = document.querySelector('.footer-sentinel');

// Utility: find focusable element in an element
function firstFocusable(container) {
  if (!container) return null;
  return container.querySelector(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
}

// IntersectionObserver: when sentinel is intersecting, reveal footer -> hide header
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // footer area reached -> hide header
      hideHeader();
    } else {
      showHeader();
    }
  });
}, {
  root: null,
  threshold: 0.00 // tweak: when sentinel is slightly visible
});

io.observe(footerSentinel);

// Accessibility: if header has activeElement, move focus to main so it's not trapped
function hideHeader() {
  if (header.classList.contains('hidden')) return;
  // if something in header has focus, move it
  const active = document.activeElement;
  if (header.contains(active)) {
    // try to focus first focusable in main or footer; fallback to main container
    const fallback = firstFocusable(main) || main;
    try { fallback.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  header.classList.add('hidden');
  header.setAttribute('aria-hidden', 'true');
  header.setAttribute('inert', '');
}

function showHeader() {
  if (!header.classList.contains('hidden')) return;
  header.classList.remove('hidden');
  header.setAttribute('aria-hidden', 'false');
  header.removeAttribute('inert');
}

export function lockScroll() {
  document.body.setAttribute('data-scroll-locked', '1');
  document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
  document.body.removeAttribute('data-scroll-locked');
  document.body.style.removeProperty('overflow');
}