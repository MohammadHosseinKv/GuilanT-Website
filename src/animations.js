const animateableSections = document.querySelectorAll('.section');

export function initializeEntranceAnimation() {
    animateableSections.forEach(section => {
        section.classList.add('enter-from-bottom');
        sectionObserver.observe(section);
    });
}

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        const section = entry.target;
        if (entry.isIntersecting) {
            section.classList.add('show');
            observer.unobserve(section);
        }
    });
}, {
    threshold: 0.01,
    rootMargin: "0px 0px -20% 0px"
});