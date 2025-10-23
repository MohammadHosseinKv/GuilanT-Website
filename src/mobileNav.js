import { lockScroll, unlockScroll } from "./main";

const openSidebarBtn = document.querySelector('.header__bars');
const mobileNavContainer = document.querySelector('.mobile-nav__menu');
const mobileNavCloseSelector = '[data-mobile-nav-close]';

function openSidebar() {
    mobileNavContainer.classList.add('show');
    openSidebarBtn.setAttribute('aria-expanded', 'true');
    mobileNavContainer.setAttribute('aria-hidden', 'false');
    mobileNavContainer.hasAttribute('inert') && mobileNavContainer.removeAttribute('inert');
    lockScroll();
}

function closeSidebar() {
    mobileNavContainer.classList.remove('show');
    openSidebarBtn.setAttribute('aria-expanded', 'false');
    mobileNavContainer.setAttribute('aria-hidden', 'true');
    mobileNavContainer.setAttribute('inert', '');
    unlockScroll();
}

export function initializeMobileNavbar() {
    openSidebarBtn.addEventListener('click', () => openSidebar());
    document.querySelectorAll(mobileNavCloseSelector).forEach(btn => {
        btn.addEventListener('click', () => closeSidebar());
    });
    mobileNavContainer.setAttribute('inert', '');
    mobileNavContainer.setAttribute('aria-hidden', 'true');

}
