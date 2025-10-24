import { clearContactSkeletons, showContactSkeletons } from "./skeletons";
import { showToast } from "./toast";

const CONTACTS_CACHE_KEY = "contacts_json_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CONTACTS_CDN_URL = "https://res.cloudinary.com/dxjjr0dte/raw/upload/tea-site-data/contacts.json";

export async function loadContacts() {
  const listContainer = document.querySelector('.contact__info__items');
  const footerContactContainer = document.querySelector('.footer__contact__items');
  const headerSocials = document.querySelector('.header__socials');
  const mobileNavSocials = document.querySelector('.mobile-nav__socials');


  try {
    const cached = localStorage.getItem(CONTACTS_CACHE_KEY);
    const now = Date.now();

    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.ts && (now - parsed.ts) < CACHE_TTL_MS && parsed.data) {
        console.log("Using cached contacts");
        generateContacts(parsed.data);
        return;
      }
    }

    showContactSkeletons(listContainer, footerContactContainer, headerSocials, mobileNavSocials, 6);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    console.log("Fetching fresh contacts.json from CDN...");
    const response = await fetch(CONTACTS_CDN_URL, { cache: "no-cache", signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const contacts = await response.json();

    // Save to localStorage with timestamp
    localStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify({
      ts: now,
      data: contacts
    }));

    clearContactSkeletons(listContainer);

    generateContacts(contacts);
    return;

  } catch (err) {
    console.error("Failed to load contacts:", err);

    if (listContainer) {
      listContainer.innerHTML = '<div class="load-error">خطا در بارگذاری راه های ارتباطی. <button id="retry-contacts" class="custom-btn-1">تلاش مجدد</button></div>';
      document.getElementById('retry-contacts')?.addEventListener('click', () => loadContacts());
    }

    showToast({ title: "خطا در اتصال", message: "بارگذاری راه های ارتباطی ناموفق بود.", type: 'error', duration: 5000 });
  }
}

export async function refreshContacts() {
  localStorage.removeItem(CONTACTS_CACHE_KEY);
  return await loadContacts();
}

export function generateContacts(contacts) {

  const contactItemsContainer = document.querySelector('.contact__info__items');
  const contactItemsFooterContainer = document.querySelector('.footer__contact__items');
  const socialsFooterContainer = document.querySelector('.footer__social__items');
  const socialsHeaderContainer = document.querySelector('.header__socials');
  const socialsMobileNavContainer = document.querySelector('.mobile-nav__socials');

  if (contactItemsContainer) contactItemsContainer.textContent = '';
  if (contactItemsFooterContainer) contactItemsFooterContainer.textContent = '';
  if (socialsFooterContainer) socialsFooterContainer.textContent = '';
  if (socialsHeaderContainer) socialsHeaderContainer.textContent = '';
  if (socialsMobileNavContainer) socialsMobileNavContainer.textContent = '';

  contacts.forEach((contact) => {
    if (!contact.visible) return;
    const linkHref = buildHref(contact);
    const isExternal = linkHref && /^https?:\/\//.test(linkHref);
    const contactItem = document.createElement('a');
    contactItem.className = 'contact__info__item';
    contactItem.setAttribute('aria-label', contact.name + ' ' + contact.value);
    contactItem.href = linkHref || "#";
    // open external links in new tab but leave tel/mailto to default behavior
    if (isExternal) contactItem.target = '_blank';
    contactItem.rel = 'noopener noreferrer';
    contactItem.innerHTML = `
      <div class="contact__info__item__info"> 
        <div aria-label="${contact.type}-icon" class="contact__info__item__img">${contact.svg}</div>
                <div class="contact__info__item__desc">
                  <h4 class="contact__info__item__desc__title">${contact.name}</h4>
                  <p class="contact__info__item__desc__subtitle" dir="${contact.valueDir}">${contact.value}</p>
                </div>
      </div>
      <button class="contact__info__item__copy" aria-label="کپی">کپی</button>
        `;
    const contactItemCopy = contactItem.querySelector('.contact__info__item__copy');
    contactItemCopy.addEventListener('click', e => {
      e.preventDefault();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        const copiedValueSpan = `<span dir="${contact.valueDir}">${contact.value}</span>`;
        navigator.clipboard.writeText(contact.value).then(showToast({ title: "کپی شد!", message: `متن '${copiedValueSpan}' در کلیپ بورد شما کپی شد.`, type: 'info', duration: 3000 }));
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
          const ok = document.execCommand('copy');
          ok ? showToast({ title: "کپی شد!", message: `متن '${contact.value}' در کلیپ بورد شما کپی شد.`, type: 'info', duration: 3000 }) : showToast({ title: "کپی نشد!", message: `کپی شکست خورد.`, type: 'error', duration: 5000 });
        } catch (err) {
          showToast({ title: "کپی نشد!", message: `کپی شکست خورد.<br>${err}`, type: 'error', duration: 5000 });
          console.error(`Copying ${contact.value} failed. -> ${err}`);
        }
        document.body.removeChild(ta);
      }
    });
    contactItemsContainer.appendChild(contactItem);

    // Filling footer contacts
    if (contact.type == 'telegram' || contact.type == 'whatsapp' || contact.type == 'instagram') {
      const socialsFooter = buildContactAnchor(contact, 'footer__social__item', linkHref, isExternal);
      socialsFooter.innerHTML = contact.svg;
      socialsFooterContainer.appendChild(socialsFooter);

      const socialsHeader = buildContactAnchor(contact, 'header__social__item', linkHref, isExternal);
      socialsHeader.innerHTML = contact.svg;
      socialsHeaderContainer.appendChild(socialsHeader);

      const socialsMobileNav = buildContactAnchor(contact, 'mobile-nav__social__item', linkHref, isExternal);
      socialsMobileNav.innerHTML = contact.svg;
      socialsMobileNavContainer.appendChild(socialsMobileNav);
    } else {
      // if (contact.type == 'workhour') return;
      const contactItemFooter = buildContactAnchor(contact, 'footer__contact__item', linkHref, isExternal);
      contactItemFooter.innerHTML = `
            ${contact.svg}
            <span dir="${contact.valueDir}">${contact.value}</span>
        `;
      contactItemsFooterContainer.appendChild(contactItemFooter);
    }

  });

}

function buildContactAnchor(contact, classList, href, isExternal) {
  const ae = document.createElement('a');
  ae.classList = classList;
  ae.setAttribute('aria-label', contact.name + ' ' + contact.value);
  ae.href = href || "#";
  // open external links in new tab but leave tel/mailto to default behavior
  if (isExternal) ae.target = '_blank';
  ae.rel = 'noopener noreferrer';
  return ae;
}

function buildHref(contact) {
  if (!contact || !contact.type) return null;

  switch (contact.type) {
    case 'tel': {
      const phone = String(contact.value).replace(/\s+/g, ''); // remove spaces
      return `tel:${phone}`;
    }
    case 'email': {
      return `mailto:${contact.value}`;
    }
    case 'instagram': {
      const username = String(contact.value).replace(/^@+/, '').trim();
      return username ? `https://instagram.com/${encodeURIComponent(username)}` : null;
    }
    case 'telegram': {
      const username = String(contact.value).replace(/^@+/, '').trim();
      return username ? `https://t.me/${encodeURIComponent(username)}` : null;
    }
    case 'whatsapp': {
      const username = String(contact.value).replace(/^@+/, '').trim();
      return username ? `https://wa.me/${encodeURIComponent(username)}` : null;
    }
    case 'address': {
      // open in Google Maps search
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.value)}`;
    }
    case 'workhour':
      return null; // not a link
    default:
      return null;
  }
}

export default {
  generateContacts,
  loadContacts,
  refreshContacts
};