gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // Preloader Animation Timeline
    const tlPreloader = gsap.timeline({
        onComplete: () => {
            document.body.classList.remove('loading');
            document.querySelector('.preloader').style.display = 'none';
            if (typeof tlHero !== 'undefined') tlHero.play();
        }
    });

    tlPreloader.fromTo(".preloader-text",
        { y: "110%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 1.5, ease: "power4.out", delay: 0.5 }
    )
        .to(".preloader-content", {
            opacity: 0,
            y: "-40%",
            duration: 1,
            ease: "power2.in",
            delay: 0.6
        })
        .to(".preloader", {
            yPercent: -100,
            duration: 1.4,
            ease: "expo.inOut"
        }, "-=0.3");

    // Initialize Lenis for Smooth Scrolling — Premium ultra-smooth feel
    const lenis = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 0.8,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    // Keep ScrollTrigger in sync with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);





    // Full Screen Menu Logic
    const menuButtons = document.querySelectorAll('.menu-btn');
    const closeBtn = document.querySelector('.menu-close-btn');
    const menuOverlay = document.querySelector('.menu-overlay');

    // Infinite Vertical Marquee in Menu
    const vStrips = document.querySelectorAll('.v-strip');
    vStrips.forEach(strip => {
        // Clone the content for seamless looping
        strip.innerHTML += strip.innerHTML;

        const parent = strip.parentElement;
        const isUp = parent.classList.contains('v-col-up');

        // Use a GSAP tween for the infinite loop
        if (isUp) {
            gsap.to(strip, { yPercent: -50, ease: "none", duration: 30, repeat: -1 });
        } else {
            gsap.set(strip, { yPercent: -50 }); // start from top (relative) so it can scroll down naturally
            gsap.to(strip, { yPercent: 0, ease: "none", duration: 30, repeat: -1 });
        }
    });

    // Create Menu Timeline
    const tlMenu = gsap.timeline({
        paused: true,
        onReverseComplete: () => {
            menuOverlay.classList.remove('menu-active');
            lenis.start();
        }
    });

    tlMenu.to(menuOverlay, { opacity: 1, duration: 0.5, ease: "expo.inOut" })
        .from(".vertical-marquee-gallery", { opacity: 0, x: -50, duration: 1.2, ease: "power3.out" }, "-=0.3")
        .fromTo(".m-link", { y: "110%" }, { y: "0%", duration: 1, stagger: 0.08, ease: "expo.out" }, "-=0.8")
        .from(".menu-footer", { opacity: 0, y: 20, duration: 0.6, ease: "power2.out" }, "-=0.6");

    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            menuOverlay.classList.add('menu-active');
            lenis.stop(); // Prevent scrolling underneath
            tlMenu.play();
        });
    });

    closeBtn.addEventListener('click', () => {
        tlMenu.reverse();
    });

    // Reveal Animations (Clip and Fade)
    const clipReveals = gsap.utils.toArray('.panel:not(.hero) .clip-reveal > *');
    clipReveals.forEach(elem => {
        gsap.to(elem, {
            y: "0%",
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
                trigger: elem.parentElement,
                start: "top 90%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Image Clip Reveals — elegant wipe-in
    const imgReveals = gsap.utils.toArray('.panel .clip-img-reveal');
    imgReveals.forEach(imgCont => {
        gsap.fromTo(imgCont,
            { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" },
            {
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                duration: 1.8,
                ease: "expo.inOut",
                scrollTrigger: {
                    trigger: imgCont,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // Header Color Inversion based on sections
    const header = document.getElementById("main-header");
    ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
            if (self.progress > 0) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        }
    });

    // Parallax on Experiences Image
    gsap.to(".parallax-img", {
        y: "10%",
        ease: "none",
        scrollTrigger: {
            trigger: ".section-experiences",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });

    // Network Bg Cards Parallax (Subtle drift)
    gsap.utils.toArray(".bg-card").forEach((card, i) => {
        gsap.to(card, {
            y: (i + 1) * -100,
            rotation: (i % 2 === 0 ? 15 : -15),
            ease: "none",
            scrollTrigger: {
                trigger: ".section-network",
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    });

    // ===== LATEST NEWS CAROUSEL =====
    const blogTrack = document.querySelector('.blog-carousel-track');
    const blogCards = document.querySelectorAll('.blog-card');
    const prevBtn = document.querySelector('.blog-nav-prev');
    const nextBtn = document.querySelector('.blog-nav-next');
    if (blogTrack && blogCards.length && prevBtn && nextBtn) {
        let currentPage = 0;
        let cardsPerView = 4;
        let cardWidth = 0;
        let gap = 0;
        let maxPage = 0;
        function calculateCarousel() {
            const wrapperWidth = document.querySelector('.blog-carousel-wrapper').offsetWidth;

            // Get visible cards count based on breakpoint
            if (window.innerWidth <= 768) {
                cardsPerView = 2;
            } else if (window.innerWidth <= 1024) {
                cardsPerView = 3;
            } else {
                cardsPerView = 4;
            }
            // Calculate gap and card width from actual DOM
            const trackStyles = window.getComputedStyle(blogTrack);
            gap = parseFloat(trackStyles.gap) || 28.8; // 1.8rem fallback
            cardWidth = blogCards[0].offsetWidth;

            maxPage = Math.max(0, blogCards.length - cardsPerView);

            // Clamp current page
            if (currentPage > maxPage) {
                currentPage = maxPage;
            }

            updateCarousel();
        }
        function updateCarousel() {
            const offset = currentPage * (cardWidth + gap);
            blogTrack.style.transform = `translateX(-${offset}px)`;

            // Update button states
            prevBtn.disabled = currentPage <= 0;
            nextBtn.disabled = currentPage >= maxPage;
        }
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updateCarousel();
            }
        });
        nextBtn.addEventListener('click', () => {
            if (currentPage < maxPage) {
                currentPage++;
                updateCarousel();
            }
        });
        // Initial calculation
        calculateCarousel();
        // Recalculate on resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(calculateCarousel, 200);
        });
    }



    // Footer Reveal Animations
    // Heading section
    gsap.from('.footer-heading-section', {
        y: 40,
        opacity: 0,
        duration: 1.5,
        ease: "expo.out",
        scrollTrigger: {
            trigger: '.main-footer',
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });

    // Nav columns stagger
    const footerNavItems = gsap.utils.toArray('.main-footer .f-nav-col, .main-footer .f-nav-center');
    footerNavItems.forEach((col, i) => {
        gsap.from(col, {
            y: 30,
            opacity: 0,
            duration: 1.2,
            delay: i * 0.12,
            ease: "expo.out",
            scrollTrigger: {
                trigger: '.footer-container',
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // CTA button
    gsap.from('.footer-cta-section', {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "expo.out",
        scrollTrigger: {
            trigger: '.footer-cta-section',
            start: "top 95%",
            toggleActions: "play none none reverse"
        }
    });

    // ===== FEATURED BLOGS — CINEMATIC VERTICAL SCROLL =====
    const fbWrapper = document.querySelector('.featured-blogs-wrapper');
    const fbItems = gsap.utils.toArray('.fb-item');
    const fbProgressBar = document.querySelector('.fb-progress-bar');
    const fbProgressDots = document.querySelectorAll('.fb-progress-dots .progress-dot');
    const fbCounterCurrent = document.querySelector('.fb-counter-current');
    const fbCounterDivider = document.querySelector('.fb-counter-divider');

    if (fbWrapper && fbItems.length) {
        let fbCurrentIndex = 0;
        let fbAnimating = false;
        const fbTotal = fbItems.length;
        let fbSectionPinned = false;

        // Cinematic easing curves
        const EASE_REVEAL = "power4.out";
        const EASE_HIDE = "power3.in";
        const EASE_IMAGE = "expo.inOut";
        const EASE_SPRING = "back.out(1.2)";

        // ── Progress & Counter updates ──
        function fbUpdateProgress(index) {
            const progress = (index + 1) / fbTotal;

            // Vertical progress bar
            if (fbProgressBar) {
                gsap.to(fbProgressBar, { height: (progress * 100) + "%", duration: 1.2, ease: "power3.out" });
            }

            // Dots — animated scale with trail
            if (fbProgressDots.length) {
                fbProgressDots.forEach((dot, i) => {
                    const isActive = i === index;
                    const isPast = i < index;
                    gsap.to(dot, {
                        scale: isActive ? 1.6 : 1,
                        backgroundColor: isActive ? "#ffca27" : isPast ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.15)",
                        boxShadow: isActive ? "0 0 14px rgba(255,202,39,0.5)" : "none",
                        duration: 0.6,
                        ease: EASE_SPRING,
                        delay: isActive ? 0 : 0.05
                    });
                    dot.classList.toggle('active', isActive);
                });
            }

            // Counter — cinematic number flip
            if (fbCounterCurrent) {
                const counterTl = gsap.timeline();
                counterTl.to(fbCounterCurrent, {
                    y: -20, opacity: 0, scale: 0.8,
                    duration: 0.3, ease: "power3.in"
                })
                .call(() => {
                    fbCounterCurrent.textContent = String(index + 1).padStart(2, '0');
                })
                .fromTo(fbCounterCurrent,
                    { y: 20, opacity: 0, scale: 0.8 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: EASE_SPRING }
                );

                // Pulse the divider line
                if (fbCounterDivider) {
                    gsap.fromTo(fbCounterDivider,
                        { scaleX: 0 },
                        { scaleX: 1, duration: 0.8, ease: "expo.out", delay: 0.2 }
                    );
                }
            }
        }

        // ── Cinematic reveal animation ──
        function fbRevealPanel(item, direction) {
            const dir = direction || 1;
            const tl = gsap.timeline();
            const line = item.querySelector('.fb-line-divider');
            const catDot = item.querySelector('.fb-cat-dot');
            const catText = item.querySelector('.fb-cat-text');
            const headings = item.querySelectorAll('.fb-heading');
            const desc = item.querySelector('.fb-desc');
            const btn = item.querySelector('.btn-primary');
            const imgWrapper = item.querySelector('.fb-img-wrapper');
            const imgEl = item.querySelector('.fb-img-wrapper img');
            const videoCard = item.querySelector('.fb-video-card');

            // Entry direction offsets
            const yIn = dir > 0 ? "80%" : "-80%";

            // ─── LINE DIVIDER: expanding from center ───
            if (line) {
                tl.fromTo(line,
                    { scaleX: 0, transformOrigin: "left center" },
                    { scaleX: 1, duration: 1.2, ease: "expo.out" },
                    0
                );
            }

            // ─── CATEGORY: dot scales in + text slides ───
            if (catDot) {
                tl.fromTo(catDot,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.6, ease: EASE_SPRING },
                    0.15
                );
            }
            if (catText) {
                tl.fromTo(catText,
                    { y: yIn, opacity: 0 },
                    { y: "0%", opacity: 1, duration: 0.9, ease: EASE_REVEAL },
                    0.2
                );
            }

            // ─── HEADINGS: cinematic stagger with slight scale ───
            if (headings.length) {
                headings.forEach((heading, idx) => {
                    tl.fromTo(heading,
                        { y: yIn, opacity: 0, skewY: dir > 0 ? 3 : -3 },
                        { y: "0%", opacity: 1, skewY: 0, duration: 1.3, ease: EASE_REVEAL },
                        0.2 + idx * 0.1
                    );
                });
            }

            // ─── DESCRIPTION: smooth fade-slide ───
            if (desc) {
                tl.fromTo(desc,
                    { y: dir > 0 ? 40 : -40, opacity: 0 },
                    { y: 0, opacity: 0.85, duration: 1.1, ease: EASE_REVEAL },
                    0.45
                );
            }

            // ─── BUTTON: springs in with overshoot ───
            if (btn) {
                tl.fromTo(btn,
                    { y: dir > 0 ? 30 : -30, opacity: 0, scale: 0.92 },
                    { y: 0, opacity: 1, scale: 1, duration: 1, ease: EASE_SPRING },
                    0.55
                );
            }

            // ─── IMAGE: sliding curtain reveal + Ken Burns zoom ───
            if (imgWrapper) {
                const clipFrom = dir > 0
                    ? "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)"   // reveal from bottom
                    : "polygon(0 0, 100% 0, 100% 0, 0 0)";              // reveal from top
                const clipTo = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";

                tl.fromTo(imgWrapper,
                    { clipPath: clipFrom },
                    { clipPath: clipTo, duration: 1.6, ease: EASE_IMAGE },
                    0.05
                );

                // Ken Burns: image starts zoomed in + shifted, settles to neutral
                if (imgEl) {
                    tl.fromTo(imgEl,
                        { scale: 1.2, y: dir > 0 ? "8%" : "-8%" },
                        { scale: 1, y: "0%", duration: 2.2, ease: "power2.out" },
                        0.05
                    );
                }
            }

            // ─── VIDEO CARD: delayed spring entrance ───
            if (videoCard && window.innerWidth > 1024) {
                tl.fromTo(videoCard,
                    { y: 80, opacity: 0, scale: 0.85, rotation: dir > 0 ? 3 : -3 },
                    { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.6, ease: EASE_SPRING },
                    0.7
                );
            }

            return tl;
        }

        // ── Cinematic hide animation ──
        function fbHidePanel(item, direction) {
            const tl = gsap.timeline();
            const line = item.querySelector('.fb-line-divider');
            const catDot = item.querySelector('.fb-cat-dot');
            const catText = item.querySelector('.fb-cat-text');
            const headings = item.querySelectorAll('.fb-heading');
            const desc = item.querySelector('.fb-desc');
            const btn = item.querySelector('.btn-primary');
            const imgWrapper = item.querySelector('.fb-img-wrapper');
            const imgEl = item.querySelector('.fb-img-wrapper img');
            const videoCard = item.querySelector('.fb-video-card');

            // Exit direction
            const yOut = direction > 0 ? "-50%" : "50%";
            const clipOut = direction > 0
                ? "polygon(0 0, 100% 0, 100% 0, 0 0)"       // wipe upward
                : "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)"; // wipe downward

            // ─── VIDEO CARD: exits first (fastest) ───
            if (videoCard && window.innerWidth > 1024) {
                tl.to(videoCard, {
                    y: direction > 0 ? -50 : 50, opacity: 0,
                    scale: 0.85, rotation: direction > 0 ? -2 : 2,
                    duration: 0.5, ease: EASE_HIDE
                }, 0);
            }

            // ─── BUTTON: fades quickly ───
            if (btn) {
                tl.to(btn, {
                    y: direction > 0 ? -20 : 20, opacity: 0, scale: 0.9,
                    duration: 0.35, ease: EASE_HIDE
                }, 0);
            }

            // ─── DESCRIPTION: slides out ───
            if (desc) {
                tl.to(desc, {
                    y: direction > 0 ? -30 : 30, opacity: 0,
                    duration: 0.4, ease: EASE_HIDE
                }, 0.03);
            }

            // ─── HEADINGS: staggered cascade out with skew ───
            if (headings.length) {
                const headArr = gsap.utils.toArray(headings);
                // Reverse order for exit (bottom heading goes first when scrolling down)
                const orderedHeads = direction > 0 ? [...headArr].reverse() : headArr;
                orderedHeads.forEach((heading, idx) => {
                    tl.to(heading, {
                        y: yOut, opacity: 0, skewY: direction > 0 ? -2 : 2,
                        duration: 0.5, ease: EASE_HIDE
                    }, 0.05 + idx * 0.04);
                });
            }

            // ─── CATEGORY: dot + text ───
            if (catText) {
                tl.to(catText, { y: yOut, opacity: 0, duration: 0.35, ease: EASE_HIDE }, 0.08);
            }
            if (catDot) {
                tl.to(catDot, { scale: 0, opacity: 0, duration: 0.3, ease: EASE_HIDE }, 0.1);
            }

            // ─── LINE: shrinks to center ───
            if (line) {
                tl.to(line, {
                    scaleX: 0, transformOrigin: "center center",
                    duration: 0.5, ease: EASE_HIDE
                }, 0);
            }

            // ─── IMAGE: curtain close + parallax drift ───
            if (imgWrapper) {
                tl.to(imgWrapper, {
                    clipPath: clipOut,
                    duration: 0.7, ease: "power2.inOut"
                }, 0.05);

                if (imgEl) {
                    tl.to(imgEl, {
                        scale: 1.08, y: direction > 0 ? "-6%" : "6%",
                        duration: 0.7, ease: "power2.in"
                    }, 0.05);
                }
            }

            return tl;
        }

        // ── Master slide transition ──
        function fbGoToSlide(newIndex, direction) {
            if (fbAnimating || newIndex === fbCurrentIndex || newIndex < 0 || newIndex >= fbTotal) return;
            fbAnimating = true;

            const outItem = fbItems[fbCurrentIndex];
            const inItem = fbItems[newIndex];

            // Master timeline with overlapping phases
            const masterTl = gsap.timeline({
                onComplete: () => {
                    fbCurrentIndex = newIndex;
                    fbAnimating = false;
                }
            });

            // Phase 1: Hide outgoing panel
            const hideTl = fbHidePanel(outItem, direction);
            masterTl.add(hideTl, 0);

            // Swap visibility at the crossover point
            masterTl.call(() => {
                outItem.classList.remove('fb-item-active');
                inItem.classList.add('fb-item-active');
            }, null, 0.4);

            // Phase 2: Reveal incoming — starts overlapping with hide phase
            const revealTl = fbRevealPanel(inItem, direction);
            masterTl.add(revealTl, 0.45);

            fbUpdateProgress(newIndex);
        }

        // ── Initial setup: reveal first panel ──
        fbUpdateProgress(0);

        // First panel cinematic entrance when scrolled into view
        ScrollTrigger.create({
            trigger: ".section-featured-blogs",
            start: "top 75%",
            once: true,
            onEnter: () => fbRevealPanel(fbItems[0], 1)
        });

        // ── Pin section & pause Lenis while pinned ──
        ScrollTrigger.create({
            trigger: ".section-featured-blogs",
            pin: true,
            pinSpacing: true,
            start: "top top",
            end: "+=50",
            invalidateOnRefresh: true,
            onEnter: () => { fbSectionPinned = true; lenis.stop(); },
            onLeave: () => { fbSectionPinned = false; lenis.start(); },
            onEnterBack: () => { fbSectionPinned = true; lenis.stop(); },
            onLeaveBack: () => { fbSectionPinned = false; lenis.start(); },
        });

        // ── Wheel handler with accumulated delta ──
        const FB_WHEEL_THRESHOLD = 60;
        let fbAccumulatedDelta = 0;
        let fbDeltaResetTimer = null;

        window.addEventListener('wheel', (e) => {
            if (!fbSectionPinned) return;

            const goingDown = e.deltaY > 0;
            const goingUp = e.deltaY < 0;

            // At edges, release to normal page scroll
            if (goingUp && fbCurrentIndex === 0) {
                lenis.start();
                fbSectionPinned = false;
                return;
            }
            if (goingDown && fbCurrentIndex === fbTotal - 1) {
                lenis.start();
                fbSectionPinned = false;
                return;
            }

            // Hijack scroll while between slides
            e.preventDefault();

            if (fbAnimating) return;

            // Accumulate wheel delta
            fbAccumulatedDelta += e.deltaY;

            // Reset if user stops scrolling
            clearTimeout(fbDeltaResetTimer);
            fbDeltaResetTimer = setTimeout(() => { fbAccumulatedDelta = 0; }, 200);

            // Trigger slide change when threshold is crossed
            if (Math.abs(fbAccumulatedDelta) >= FB_WHEEL_THRESHOLD) {
                if (fbAccumulatedDelta > 0) {
                    fbGoToSlide(fbCurrentIndex + 1, 1);
                } else {
                    fbGoToSlide(fbCurrentIndex - 1, -1);
                }
                fbAccumulatedDelta = 0;
            }
        }, { passive: false });

        // ── Touch support ──
        let fbTouchStartY = 0;
        const fbSection = document.querySelector('.section-featured-blogs');

        fbSection.addEventListener('touchstart', (e) => {
            fbTouchStartY = e.touches[0].clientY;
        }, { passive: true });

        fbSection.addEventListener('touchend', (e) => {
            if (!fbSectionPinned || fbAnimating) return;
            const deltaY = fbTouchStartY - e.changedTouches[0].clientY;
            if (Math.abs(deltaY) < 50) return;

            // At edges, release
            if (deltaY > 0 && fbCurrentIndex === fbTotal - 1) {
                lenis.start();
                fbSectionPinned = false;
                return;
            }
            if (deltaY < 0 && fbCurrentIndex === 0) {
                lenis.start();
                fbSectionPinned = false;
                return;
            }

            if (deltaY > 0 && fbCurrentIndex < fbTotal - 1) {
                fbGoToSlide(fbCurrentIndex + 1, 1);
            } else if (deltaY < 0 && fbCurrentIndex > 0) {
                fbGoToSlide(fbCurrentIndex - 1, -1);
            }
        }, { passive: true });

        // ── Dot click navigation ──
        fbProgressDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                if (!fbSectionPinned || fbAnimating || i === fbCurrentIndex) return;
                const direction = i > fbCurrentIndex ? 1 : -1;
                fbGoToSlide(i, direction);
            });
        });
    }

    // Refresh ScrollTrigger
    ScrollTrigger.refresh();

    // Hero Landing Animation
    const tlHero = gsap.timeline({ paused: true });
    tlHero.from(".hero-socials .social-icon", { opacity: 0, x: -30, duration: 1, stagger: 0.1, ease: "power3.out" });

    // ===== PRODUCT GRID STAGGERED REVEAL =====
    const productItems = gsap.utils.toArray('.product-item');
    if (productItems.length) {
        productItems.forEach((item, i) => {
            gsap.fromTo(item,
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    delay: i * 0.1,
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: '.section-products',
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }

    // ===== ABOUT SECTION IMAGE PARALLAX =====
    const aboutImages = gsap.utils.toArray('.about-img-main img, .about-img-sub img');
    aboutImages.forEach(img => {
        gsap.fromTo(img,
            { y: "-5%" },
            {
                y: "5%",
                ease: "none",
                scrollTrigger: {
                    trigger: img.closest('.about-img-main, .about-img-sub'),
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5
                }
            }
        );
    });

    // ===== SHOP CTA MAIN IMAGE PARALLAX =====
    const ctaMainImg = document.querySelector('.cta-main-img img');
    if (ctaMainImg) {
        gsap.fromTo(ctaMainImg,
            { y: "-3%" },
            {
                y: "3%",
                ease: "none",
                scrollTrigger: {
                    trigger: '.section-shop-cta',
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 2
                }
            }
        );
    }

    // ===== BLOG CARD STAGGER ON SCROLL =====
    const blogSection = document.querySelector('.section-blog');
    if (blogSection) {
        const visibleBlogCards = gsap.utils.toArray('.blog-card').slice(0, 4);
        gsap.fromTo(visibleBlogCards,
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.1,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: blogSection,
                    start: "top 75%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // ===== SOCIAL CARDS SCROLL REVEAL =====
    const socialCards2 = gsap.utils.toArray('.social-fan-container .social-card');
    if (socialCards2.length) {
        gsap.fromTo(socialCards2,
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.4,
                stagger: 0.08,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: '.social-fan-container',
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // ===== MOBILE SOCIAL CARD LIGHTBOX =====
    const lightbox = document.getElementById('socialLightbox');
    const lightboxImg = document.getElementById('socialLightboxImg');
    const lightboxCounter = document.getElementById('socialLightboxCounter');
    const lightboxClose = lightbox?.querySelector('.social-lightbox-close');
    const lightboxBackdrop = lightbox?.querySelector('.social-lightbox-backdrop');
    const socialCards = document.querySelectorAll('.social-fan-container .social-card');

    if (lightbox && socialCards.length) {
        let lightboxOpen = false;

        function openLightbox(card, index) {
            if (window.innerWidth > 768) return; // Only on mobile
            const img = card.querySelector('img');
            if (!img) return;

            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCounter.textContent = `${index + 1} / ${socialCards.length}`;
            lightbox.classList.add('active');
            lightboxOpen = true;

            // Animate in with GSAP
            const tl = gsap.timeline();
            tl.fromTo(lightboxBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" })
              .fromTo(lightbox.querySelector('.social-lightbox-img-wrapper'),
                { scale: 0.7, opacity: 0, y: 60 },
                { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, "-=0.25")
              .fromTo(lightboxClose, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, "-=0.3")
              .fromTo(lightboxCounter, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");
        }

        function closeLightbox() {
            if (!lightboxOpen) return;
            const tl = gsap.timeline({
                onComplete: () => {
                    lightbox.classList.remove('active');
                    lightboxOpen = false;
                }
            });
            tl.to(lightbox.querySelector('.social-lightbox-img-wrapper'),
                { scale: 0.8, opacity: 0, y: 40, duration: 0.35, ease: "power2.in" })
              .to(lightboxClose, { opacity: 0, duration: 0.2 }, "-=0.3")
              .to(lightboxCounter, { opacity: 0, duration: 0.2 }, "-=0.3")
              .to(lightboxBackdrop, { opacity: 0, duration: 0.3, ease: "power2.in" }, "-=0.15");
        }

        socialCards.forEach((card, i) => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(card, i);
            });
        });

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxBackdrop.addEventListener('click', closeLightbox);
    }
    
    // YouTube Video Click-to-Play (inline iframe)
    const ytCards = document.querySelectorAll('.yt-video-wrapper[data-yt-id]');
    ytCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('is-playing')) return;

            // Pause any other playing videos
            ytCards.forEach(other => {
                if (other !== card && other.classList.contains('is-playing')) {
                    other.classList.remove('is-playing');
                    const otherIframe = other.querySelector('.yt-iframe-player');
                    if (otherIframe) otherIframe.src = '';
                }
            });

            const videoId = card.dataset.ytId;
            const iframe = card.querySelector('.yt-iframe-player');
            if (iframe && videoId) {
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&playsinline=1`;
                card.classList.add('is-playing');
            }
        });
    });
});
