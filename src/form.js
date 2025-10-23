import { showToast } from "./toast";

export function initializeForm() {
  const form = document.getElementById('orderForm');
  if (!form) return;
  form.setAttribute('novalidate', 'novalidate');

  const fields = {
    shopName: form.querySelector('[name="entry.2033700216"]'),
    phone: form.querySelector('[name="entry.68392148"]'),
    products: form.querySelector('[name="entry.1952081265"]'),
    address: form.querySelector('[name="entry.1217595251"]'),
    notes: form.querySelector('[name="entry.422124854"]'),
    honeypot: form.querySelector('[name="hidden_hp"]')
  };

  function getErrorContainer(field) {
    const wrapper = field.closest('.contact__form__item');
    return wrapper ? wrapper.querySelector('.field-error') : null;
  }
  function setFieldError(field, message) {
    const err = getErrorContainer(field);
    if (err) err.textContent = message;
    field.setAttribute('aria-invalid', 'true');
  }
  function clearFieldError(field) {
    const err = getErrorContainer(field);
    if (err) err.textContent = '';
    field.removeAttribute('aria-invalid');
  }
  function clearAllErrors() {
    Object.values(fields).forEach(f => { if (f && f.tagName) clearFieldError(f); });
  }

  // ---------- PHONE VALIDATION (improved) ----------
  // normalize: remove spaces, dashes, parentheses; keep digits only.
  // but handle leading '+' and leading international '00' properly by removing '+' and removing ONE leading '00' if present.
  function normalizeForIran(raw) {
    if (raw == null) return '';
    // trim first
    let s = String(raw).trim();
    // If starts with +, remove it (we'll treat as country code)
    if (s.startsWith('+')) s = s.slice(1);
    // Remove all non-digit characters
    s = s.replace(/\D/g, '');
    // If it starts with a single leading '00' (international prefix), strip it once
    if (s.startsWith('00')) s = s.replace(/^00/, '');
    return s; // only digits now, possible forms: 98912..., 0912..., 912..., 9821..., 021...
  }

  // Determine if it's an Iranian mobile
  function isIranMobile(digitsOnly) {
    // digitsOnly: e.g. '98912xxxxxxx' or '0912xxxxxxx' or '912xxxxxxx'
    if (!digitsOnly) return false;
    // case: starts with country code 98 + 9xxxxxxxxx (total 12 digits)
    if (/^98(9\d{9})$/.test(digitsOnly)) return true;
    // case: local with leading 0: 09xxxxxxxxx (11 digits)
    if (/^09(9\d{9})$/.test(digitsOnly)) return true;
    // case: without leading 0: 9xxxxxxxxx (10 digits)
    if (/^9\d{9}$/.test(digitsOnly)) return true;
    return false;
  }

  // Determine if it's likely an Iranian landline (simple, pragmatic)
  function isIranLandline(digitsOnly) {
    if (!digitsOnly) return false;
    // if it matched mobile, it's not landline
    if (isIranMobile(digitsOnly)) return false;

    // common cases:
    // - with leading 0 (0 + areaCode + number) typical lengths: 10 or 11 (e.g., 02112345678 => 11)
    if (/^0\d{9,10}$/.test(digitsOnly)) return true;
    // - with country code 98 + areaCode + number (e.g., 982112345678 -> 12) ; allow some variation
    if (/^98\d{9,11}$/.test(digitsOnly)) return true;
    // - local without leading 0 (rare) but allow 7..8 digits for small towns
    if (/^\d{7,8}$/.test(digitsOnly)) return true;

    return false;
  }

  // main validator returning object { ok: bool, type?: 'mobile'|'landline', message?: string, normalized?: string }
  function validatePhoneRaw(rawInput) {
    const digits = normalizeForIran(rawInput);
    if (!digits) return { ok: false, message: 'شماره تماس را وارد کنید.' };

    // mobile?
    if (isIranMobile(digits)) {
      return { ok: true, type: 'mobile', normalized: digits };
    }
    // landline?
    if (isIranLandline(digits)) {
      return { ok: true, type: 'landline', normalized: digits };
    }

    // else not valid
    return {
      ok: false,
      message: 'فرمت شماره تماس معتبر نیست. مثال‌های مجاز: ...0912, ...912, ...912 98+, 02112345678'
    };
  }

  // ---------- UX: debounce helper ----------
  function debounce(fn, wait = 250) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ---------- Real-time phone validation ----------
  const phoneInput = fields.phone;
  if (phoneInput) {
    const runPhoneValidation = () => {
      const res = validatePhoneRaw(phoneInput.value);
      if (!res.ok) setFieldError(phoneInput, res.message);
      else clearFieldError(phoneInput);
    };
    const debounced = debounce(runPhoneValidation, 200);
    phoneInput.addEventListener('input', debounced);
    phoneInput.addEventListener('blur', () => {
      const res = validatePhoneRaw(phoneInput.value);
      if (!res.ok) {
        setFieldError(phoneInput, res.message);
        showToast({ title: "شماره نامعتبر", message: `فرمت شماره تماس معتبر نیست. مثال های مجاز:  <span dir="ltr">0912... - 912... - +98 912... - 02112345678</span>`, type: 'warn', duration: 4000 });
      } else {
        clearFieldError(phoneInput);
      }
    });
  }

  // other fields: clear error on input
  ['shopName', 'products', 'address', 'notes'].forEach(k => {
    const f = fields[k];
    if (!f) return;
    f.addEventListener('input', () => clearFieldError(f));
  });

  // ---------- submit ----------
  form.addEventListener('submit', function (e) {
    // honeypot
    if (fields.honeypot && fields.honeypot.value.trim()) {
      e.preventDefault();
      showToast({ title: "خطا", message: 'عملیات به دلیل شناسایی اسپم انجام نشد.', type: 'error', duration: 5000 });
      return;
    }

    clearAllErrors();
    let valid = true;
    let firstInvalid = null;

    if (!fields.shopName || !fields.shopName.value.trim()) {
      setFieldError(fields.shopName, 'نام فروشگاه را وارد کنید.');
      valid = false;
      firstInvalid = firstInvalid || fields.shopName;
    }

    const phoneCheck = validatePhoneRaw(fields.phone ? fields.phone.value : '');
    if (!phoneCheck.ok) {
      setFieldError(fields.phone, phoneCheck.message);
      valid = false;
      firstInvalid = firstInvalid || fields.phone;
    }

    if (!fields.products || !fields.products.value.trim() || fields.products.value.trim().length < 3) {
      setFieldError(fields.products, 'محصول/مقدار را بنویسید. (حداقل 3 حرف)');
      valid = false;
      firstInvalid = firstInvalid || fields.products;
    }

    if (!fields.address || !fields.address.value.trim() || fields.address.value.trim().length < 5) {
      setFieldError(fields.address, 'آدرس را کامل وارد کنید. (حداقل 5 حرف)');
      valid = false;
      firstInvalid = firstInvalid || fields.address;
    }

    if (!valid) {
      e.preventDefault();
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
      const firstMessage = getErrorContainer(firstInvalid)?.textContent || 'لطفاً موارد خواسته شده را تکمیل کنید.';
      showToast({ title: "خطا", message: firstMessage, type: 'error', duration: 4500 });
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(() => {
      showToast({ title: "سفارش دریافت شد", message: 'ممنون از اینکه ما را انتخاب کردید🙇.<br> در ظرف 24 ساعت با شما تماس خواهیم گرفت.', type: 'success', duration: 5000 });
      if (btn) btn.disabled = false;
      this.reset();
      clearAllErrors();
    }, 1200);
    // allow submission to hidden iframe
  });
}
