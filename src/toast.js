
const closeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

class Toaster {
    constructor(container = document.getElementById('toaster'), opts = {}) {
        this.container = container;
        this.opts = Object.assign({
            position: 'top-right', // reserved for future
            maxToasts: 6
        }, opts);
        this.toasts = new Set();

        // Pause when page loses visibility (optional but recommended)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.toasts.forEach(t => t.pause('visibility'));
            } else {
                this.toasts.forEach(t => t.resume('visibility'));
            }
        });
    }

    show({ title = '', message = '', type = 'info', duration = 5000 } = {}) {
        // enforce stacking limit
        if (this.container.children.length >= this.opts.maxToasts) {
            // remove oldest
            const first = this.container.firstElementChild;
            if (first && first.__toastInstance) first.__toastInstance.remove(true);
        }
        const toast = new ToastItem(this, { title, message, type, duration });
        this.toasts.add(toast);
        this.container.appendChild(toast.el);
        // add show class after appending to allow transition
        requestAnimationFrame(() => toast.el.classList.add('show'));
        // cleanup when removed
        toast.promise.finally(() => this.toasts.delete(toast));
        return toast;
    }
}

/** Represents a single toast element with lifecycle controls */
class ToastItem {
    constructor(manager, { title, message, type, duration }) {
        this.manager = manager;
        this.title = title;
        this.message = message;
        this.type = type;
        this.duration = Math.max(200, duration || 4000); // clamp minimum
        this.remaining = this.duration;
        this.startTime = null;
        this.timer = null;
        this.pausedReasons = new Set();
        this._createElement();
        this._wireEvents();
        this.promise = new Promise((resolve) => { this._resolveRemoved = resolve; });
        this._start();
    }

    _createElement() {
        const el = document.createElement('div');
        el.className = `toast toast--${this.type}`;
        el.setAttribute('role', 'status'); // polite announcements
        el.setAttribute('tabindex', '0'); // allow focus to pause
        el.__toastInstance = this;

        el.innerHTML = `
      <div class="toast__body">
        <div inert class="toast__icon" aria-hidden="true">${this._iconForType(this.type)}</div>
        <div class="toast__content">
          <div class="toast__title">${this.title}</div>
          <p class="toast__message">${this.message}</p>
        </div>
        <div class="toast__actions">
          <button class="toast__close" aria-label="Dismiss notification">${closeSvg}</button>
        </div>
      </div>
      <div inert class="toast__timebar" aria-hidden="true">
        <div class="progress"></div>
      </div>
    `;

        // set progress bar animation according to duration
        const progress = el.querySelector('.progress');
        progress.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)), var(--accent)';
        progress.style.animation = `deplete ${this.duration}ms linear forwards`;
        // store refs
        this.el = el;
        this.progressEl = progress;
        this.closeBtn = el.querySelector('.toast__close');
    }

    _wireEvents() {
        // mouse hover / focus pause
        this._mouseenter = () => this.pause('hover');
        this._mouseleave = () => this.resume('hover');
        this._focus = () => this.pause('focus');
        this._blur = () => this.resume('focus');

        this.el.addEventListener('mouseenter', this._mouseenter);
        this.el.addEventListener('mouseleave', this._mouseleave);
        this.el.addEventListener('focusin', this._focus);
        this.el.addEventListener('focusout', this._blur);

        // close button
        this.closeBtn.addEventListener('click', () => this.remove());

        // dismiss on Esc when focused inside
        this._keyHandler = (e) => {
            if (e.key === 'Escape') this.remove();
        };
        this.el.addEventListener('keydown', this._keyHandler);

        // allow clicking outside to do nothing; pointer-events on container will manage behavior
    }

    _start() {
        this.startTime = performance.now();
        this._setTimer(this.remaining);
    }

    _setTimer(ms) {
        // ensure no prior timer
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.remove(), ms);
    }

    pause(reason = 'manual') {
        if (this.pausedReasons.has(reason)) return;
        // compute remaining
        if (!this.startTime) return;
        const elapsed = performance.now() - this.startTime;
        this.remaining = Math.max(0, this.remaining - elapsed);
        this.pausedReasons.add(reason);

        // pause JS timer
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        // pause CSS animation via class
        this.el.classList.add('paused');
        this.startTime = null;
    }

    resume(reason = 'manual') {
        if (!this.pausedReasons.has(reason)) return;
        this.pausedReasons.delete(reason);
        if (this.pausedReasons.size > 0) return; // still paused by another reason

        // resume timer & animation
        this.startTime = performance.now();
        this._setTimer(this.remaining);

        // resume CSS animation: toggling animation-play-state is enough because we never changed animation
        this.el.classList.remove('paused');
    }

    remove(skipAnimation = false) {
        // if already removing or removed
        if (!this.el) return this.promise;
        // clear timers and event listeners
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;

        const cleanup = () => {
            try {
                this._teardown();
            } catch (e) { /* ignore */ }
            this._resolveRemoved();
        };

        if (skipAnimation) {
            this.el.remove();
            cleanup();
            this.el = null;
        } else {
            // play hide animation then remove on transitionend
            this.el.classList.remove('show');
            this.el.classList.add('hide');
            const onEnd = (ev) => {
                if (ev.target !== this.el) return;
                this.el.removeEventListener('transitionend', onEnd);
                if (this.el) this.el.remove();
                cleanup();
                this.el = null;
            };
            this.el.addEventListener('transitionend', onEnd);
            // fallback removal after 500ms in case transitionend doesn't fire
            setTimeout(() => {
                if (this.el) {
                    try { this.el.remove(); } catch (e) { }
                    cleanup();
                    this.el = null;
                }
            }, 600);
        }
        return this.promise;
    }

    _teardown() {
        if (!this.el) return;
        this.el.removeEventListener('mouseenter', this._mouseenter);
        this.el.removeEventListener('mouseleave', this._mouseleave);
        this.el.removeEventListener('focusin', this._focus);
        this.el.removeEventListener('focusout', this._blur);
        this.el.removeEventListener('keydown', this._keyHandler);
        if (this.timer) clearTimeout(this.timer);
    }

    _iconForType(type) {
        switch (type) {
            case 'success': return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
            case 'error': return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-alert-icon lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
            case 'warn': return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
            case 'info': return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
            default: return '';
        }
    }
}


/* Expose a global toaster */
const toaster = new Toaster();            // default singleton using #toaster element
// Simple helper for global use:
// toaster.show({ title, message, type: 'success|info|warn|error', duration: ms })
function showToast(opts) { return toaster.show(opts); }

/* Named exports + default export */
export { Toaster, toaster, showToast };
export default toaster;