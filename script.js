document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    lucide.createIcons();

    // ---- Carousel Auto-scroll and Pagination ----
    const carousel = document.querySelector('.banner-carousel');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    if (carousel && dots.length > 0) {
        let autoScrollInterval;
        const totalSlides = dots.length;

        const updateDots = (index) => {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[index]) {
                dots[index].classList.add('active');
            }
        };

        // Listen for scroll to update dots
        carousel.addEventListener('scroll', () => {
            const scrollPosition = carousel.scrollLeft;
            const slideWidth = carousel.clientWidth;
            // Round to nearest slide index based on scroll position
            const activeIndex = Math.round(scrollPosition / slideWidth);
            updateDots(activeIndex);
        });

        const startAutoScroll = () => {
            clearInterval(autoScrollInterval); // Prevent multiple intervals
            autoScrollInterval = setInterval(() => {
                const scrollPosition = carousel.scrollLeft;
                const slideWidth = carousel.clientWidth;
                let nextIndex = Math.round(scrollPosition / slideWidth) + 1;
                
                if (nextIndex >= totalSlides) {
                    nextIndex = 0; // Loop back to first slide
                }
                
                carousel.scrollTo({
                    left: nextIndex * slideWidth,
                    behavior: 'smooth'
                });
            }, 3000); // 3 seconds per slide
        };

        const stopAutoScroll = () => {
            clearInterval(autoScrollInterval);
        };

        // Pause auto-scroll when user touches/interacts with carousel manually
        carousel.addEventListener('touchstart', stopAutoScroll, { passive: true });
        carousel.addEventListener('touchend', startAutoScroll, { passive: true });
        carousel.addEventListener('mousedown', stopAutoScroll);
        carousel.addEventListener('mouseup', startAutoScroll);
        carousel.addEventListener('mouseleave', () => {
            startAutoScroll();
        });

        // Initialize auto scroll
        startAutoScroll();
    }

    const scrollContainer = document.getElementById('scroll-container');
    const stickyNav = document.getElementById('sticky-nav');
    const chips = document.querySelectorAll('.chip-item');
    const sections = document.querySelectorAll('.menu-section');
    const chipContainer = document.getElementById('category-chips');
    
    // Add scroll-margin-top to sections so scrollIntoView accounts for sticky nav
    // Calculate approximate height of sticky nav
    const stickyNavHeight = stickyNav.offsetHeight;
    sections.forEach(sec => {
        sec.style.scrollMarginTop = `${stickyNavHeight + 20}px`;
    });

    let isClickScrolling = false;
    let scrollTimeout;

    // 1. Click on chips to scroll to section
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            const targetId = chip.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                isClickScrolling = true;
                
                // Update active state manually
                updateActiveChip(chip, true);
                
                // Scroll into view
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Reset click scrolling flag after scroll animation completes
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isClickScrolling = false;
                }, 600); // Wait for smooth scroll to finish (approx 600ms)
            }
        });
    });

    // 2. Intersection Observer for Scroll Spy
    // We observe sections to see which one is currently in view
    const observerOptions = {
        root: scrollContainer,
        rootMargin: `-${stickyNavHeight + 30}px 0px -50% 0px`, // Trigger near top, just below sticky nav
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        // If we are scrolling because of a click, ignore intersection updates
        if (isClickScrolling) return;

        let activeEntry = null;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // If multiple intersect, we want the one closest to top, but usually they are sequential.
                // We just take the latest intersecting one.
                activeEntry = entry;
            }
        });

        if (activeEntry) {
            const id = activeEntry.target.getAttribute('id');
            const correspondingChip = document.querySelector(`.chip-item[data-target="${id}"]`);
            if (correspondingChip) {
                updateActiveChip(correspondingChip, false);
            }
        }
    }, observerOptions);

    sections.forEach(sec => observer.observe(sec));

    function updateActiveChip(activeChip, isClick = false) {
        // Prevent redundant updates that cause vibration
        if (activeChip.classList.contains('active')) return;

        // Remove active class from all
        chips.forEach(c => c.classList.remove('active'));
        // Add to targeted
        activeChip.classList.add('active');
        
        // Calculate offset to center the chip
        const scrollLeft = activeChip.offsetLeft - (chipContainer.offsetWidth / 2) + (activeChip.offsetWidth / 2);
        
        chipContainer.scrollTo({
            left: scrollLeft,
            // Use 'auto' (instant) during native scroll to avoid jitter/vibration, 'smooth' only on click
            behavior: isClick ? 'smooth' : 'auto'
        });
    }

    // 3. Detect when Sticky Nav is stuck to add shadow using IntersectionObserver
    // This avoids layout thrashing (synchronous reflows) during scroll which causes vibration
    const navSentinel = document.getElementById('nav-sentinel');
    if (navSentinel) {
        const stickyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If the sentinel is no longer intersecting with the scroll container's top,
                // it means it has scrolled up out of view, so the nav is stuck!
                if (!entry.isIntersecting) {
                    stickyNav.classList.add('is-stuck');
                } else {
                    stickyNav.classList.remove('is-stuck');
                }
            });
        }, {
            root: scrollContainer,
            threshold: 0,
            rootMargin: '0px 0px 0px 0px'
        });
        
        stickyObserver.observe(navSentinel);
    }
});
