/**
 * Utility: safely run code after DOM is parsed
 */
document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initActiveNavLink();
    initSmoothScroll();
    initContactForm();
    initEnquiryForm();
    initImageLightbox();
    initScrollReveal();
    initBackToTop();
    setCurrentYear();
});

/* ------------------------------------------------------------
   1. Mobile Navigation Toggle
   ------------------------------------------------------------ */
function initMobileNav() {
    const nav = document.querySelector('.nav-links');
    const header = document.querySelector('header');
    if (!nav || !header) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';

    header.insertBefore(toggleBtn, nav);

    toggleBtn.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        toggleBtn.classList.toggle('active', isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
            nav.classList.remove('nav-open');
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.focus();
        }
    });
}

/* ------------------------------------------------------------
   2. Highlight Active Navigation Link
   ------------------------------------------------------------ */
function initActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/* ------------------------------------------------------------
   3. Smooth Scroll for In-Page Anchors
   ------------------------------------------------------------ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* ------------------------------------------------------------
   4. Contact Form Validation & Feedback
   ------------------------------------------------------------ */
function initContactForm() {
    const form = document.querySelector('.contact-container form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showFormMessage(form, '✅ Thank you! We will get back to you shortly.', 'success');
        form.reset();
    });
}

/* ------------------------------------------------------------
   5. Enquiry Form Validation & Feedback
   ------------------------------------------------------------ */
function initEnquiryForm() {
    const form = document.querySelector('#enquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name  = form.querySelector('#name');
        const email = form.querySelector('#email');
        const phone = form.querySelector('#phonenumber');

        const errors = [];
        if (name && name.value.trim().length < 2) errors.push('Please enter your name.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            errors.push('Please enter a valid email address.');
        }
        if (phone && phone.value.replace(/\D/g, '').length < 10) {
            errors.push('Please enter a valid phone number (at least 10 digits).');
        }

        if (errors.length > 0) {
            showFormMessage(form, '⚠️ ' + errors.join(' '), 'error');
            return;
        }

        showFormMessage(
            form,
            `✅ Thanks ${name.value.trim()}! Your enquiry has been sent.`,
            'success'
        );
        form.reset();
    });
}

/* ------------------------------------------------------------
   Helper: render a form feedback message
   ------------------------------------------------------------ */
function showFormMessage(form, text, type) {
    let msg = form.querySelector('.form-message');
    if (!msg) {
        msg = document.createElement('p');
        msg.className = 'form-message';
        form.appendChild(msg);
    }
    msg.textContent = text;
    msg.className = 'form-message ' + type;
}

/* ------------------------------------------------------------
   6. Image Lightbox WITH slideshow arrows + caption / counter
   ------------------------------------------------------------ */
function initImageLightbox() {
    // Collect ALL images that should be zoomable, in document order.
    const images = Array.from(document.querySelectorAll(
        '.gallery-grid img, .hex-item img, .gallery-container img, .category img, .image-container img'
    ));
    if (images.length === 0) return;

    // Build lightbox once
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close image">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">&#10094;</button>
        <img class="lightbox-img" src="" alt="">
        <button class="lightbox-next" aria-label="Next image">&#10095;</button>
        <div class="lightbox-caption" aria-live="polite">
            <span class="lightbox-caption-text"></span>
            <span class="lightbox-counter"></span>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg      = lightbox.querySelector('.lightbox-img');
    const closeBtn         = lightbox.querySelector('.lightbox-close');
    const prevBtn          = lightbox.querySelector('.lightbox-prev');
    const nextBtn          = lightbox.querySelector('.lightbox-next');
    const captionText      = lightbox.querySelector('.lightbox-caption-text');
    const captionCounter   = lightbox.querySelector('.lightbox-counter');

    let currentIndex = 0;
    let lastFocused = null;

    // Get caption text for an image:
    // - first try its parent <figure>'s <figcaption>
    // - fall back to alt text
    function getCaption(img) {
        const figure = img.closest('figure');
        if (figure) {
            const figcap = figure.querySelector('figcaption');
            if (figcap && figcap.textContent.trim()) {
                return figcap.textContent.trim();
            }
        }
        return (img.alt || 'Product image').trim();
    }

    function show(index) {
        // Wrap around
        if (index < 0) index = images.length - 1;
        if (index >= images.length) index = 0;

        currentIndex = index;
        const img = images[currentIndex];
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Enlarged product image';

        // Caption + counter e.g. "1 of 9"
        captionText.textContent = getCaption(img);
        captionCounter.textContent = `${currentIndex + 1} of ${images.length}`;

        // Hide arrows if only one image
        const single = images.length <= 1;
        prevBtn.style.display = single ? 'none' : '';
        nextBtn.style.display = single ? 'none' : '';
        captionCounter.style.display = single ? 'none' : '';
    }

    function open(index, trigger) {
        lastFocused = trigger || document.activeElement;
        show(index);
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function close() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lightboxImg.src = '';
        if (lastFocused) lastFocused.focus();
    }

    function next() { show(currentIndex + 1); }
    function prev() { show(currentIndex - 1); }

    // Wire up each image / gallery-item so clicking opens at correct index
    images.forEach((img, i) => {
        img.style.cursor = 'zoom-in';
        const trigger = img.closest('.gallery-item') || img;

        if (trigger.tagName !== 'IMG') {
            trigger.setAttribute('tabindex', '0');
            trigger.setAttribute('role', 'button');
            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open(i, trigger);
                }
            });
        }
        trigger.addEventListener('click', () => open(i, trigger));
    });

    // Controls
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

    // Click outside image closes
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
    });

    // Keyboard: Esc closes, arrows navigate
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') next();
        else if (e.key === 'ArrowLeft') prev();
    });
}

/* ------------------------------------------------------------
   7. Scroll Reveal Animation
   ------------------------------------------------------------ */
function initScrollReveal() {
    const revealTargets = document.querySelectorAll(
        'h1, h2, p, .category, .gallery-container > div, .image-container img'
    );
    if (revealTargets.length === 0 || !('IntersectionObserver' in window)) return;

    revealTargets.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealTargets.forEach(el => observer.observe(el));
}

/* ------------------------------------------------------------
   8. Back-to-Top Button
   ------------------------------------------------------------ */
function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ------------------------------------------------------------
   9. Auto Year in Footer
   ------------------------------------------------------------ */
function setCurrentYear() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const year = new Date().getFullYear();
    const info = footer.querySelector('.contact-info');
    if (info) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>&copy; ${year} Heritage Beadwork</strong>`;
        info.appendChild(p);
    }
}