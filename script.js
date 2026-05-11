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

    // Initialize Lenis for Smooth Scrolling — Optimized for performance
    const lenis = new Lenis({
        lerp: 0.1, // Faster interpolation for better performance
        wheelMultiplier: 1,
        touchMultiplier: 2,
        smoothWheel: true,
        smoothTouch: false,
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

    if (menuButtons.length > 0 && menuOverlay) {
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

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                tlMenu.reverse();
            });
        }
    }

    // Logo Click Navigation
    const logos = document.querySelectorAll('.logo');
    logos.forEach(logo => {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    });

    // Reveal Animations (Clip and Fade)
    const clipReveals = gsap.utils.toArray('.panel:not(.hero) .clip-reveal > *');
    clipReveals.forEach(elem => {
        gsap.to(elem, {
            y: "0%",
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
                trigger: elem.parentElement,
                start: "top 95%",
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
                duration: 1.2,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: imgCont,
                    start: "top 95%",
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





    // ===== FEATURED BLOGS — CINEMATIC HORIZONTAL SCROLL =====
    const fbSection = document.querySelector('.section-featured-blogs');
    const fbTrack = document.querySelector('.fb-horizontal-track');
    const fbItems = gsap.utils.toArray('.fb-item');
    const fbProgressBar = document.querySelector('.fb-progress-bar');
    const fbProgressDots = document.querySelectorAll('.fb-progress-dots .progress-dot');
    const fbCounterCurrent = document.querySelector('.fb-counter-current');
    const fbBgText = document.querySelector('.fb-bg-text');


    if (fbSection && fbTrack && fbItems.length) {
        const fbTotal = fbItems.length;

        // ── Background Text (Static Pinned) ──
        // The fbBgText is positioned in CSS and remains perfectly fixed on the left 
        // to align beautifully with each incoming blog panel.

        // ── Cinematic Easing Curves ──
        const EASE_SPRING = "back.out(1.2)";

        // Calculate the total scroll distance (all panels minus one viewport)
        function getScrollAmount() {
            return -(fbTrack.scrollWidth - window.innerWidth);
        }

        // ── Main Horizontal Scroll Animation ──
        const fbHorizontalTween = gsap.to(fbTrack, {
            x: getScrollAmount,
            ease: "none",
            scrollTrigger: {
                trigger: fbSection,
                start: "top top",
                end: () => "+=" + (fbTrack.scrollWidth - window.innerWidth),
                pin: true,
                scrub: 1, // Reduced scrub for lower latency
                invalidateOnRefresh: true,
                anticipatePin: 1,
                fastScrollEnd: true,
                preventOverlaps: true,
                onUpdate: (self) => {
                    const progress = self.progress;
                    
                    // ── Update Progress Bar (width-based, horizontal) ──
                    if (fbProgressBar) {
                        fbProgressBar.style.width = (progress * 100) + "%";
                    }

                    // ── Update Counter ──
                    const currentIndex = Math.min(
                        Math.floor(progress * fbTotal),
                        fbTotal - 1
                    );
                    
                    if (fbCounterCurrent) {
                        const newText = String(currentIndex + 1).padStart(2, '0');
                        if (fbCounterCurrent.textContent !== newText) {
                            // Animate counter change
                            gsap.to(fbCounterCurrent, {
                                y: -12, opacity: 0, scale: 0.85,
                                duration: 0.2, ease: "power2.in",
                                onComplete: () => {
                                    fbCounterCurrent.textContent = newText;
                                    gsap.fromTo(fbCounterCurrent,
                                        { y: 12, opacity: 0, scale: 0.85 },
                                        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: EASE_SPRING }
                                    );
                                }
                            });
                        }
                    }

                    // ── Update Dots ──
                    if (fbProgressDots.length) {
                        fbProgressDots.forEach((dot, i) => {
                            const isActive = i === currentIndex;
                            const isPast = i < currentIndex;
                            dot.classList.toggle('active', isActive);
                            gsap.to(dot, {
                                scale: isActive ? 1.6 : 1,
                                backgroundColor: isActive
                                    ? "#ffca27"
                                    : isPast
                                        ? "rgba(0,0,0,0.35)"
                                        : "rgba(0,0,0,0.15)",
                                boxShadow: isActive ? "0 0 14px rgba(255,202,39,0.5)" : "none",
                                duration: 0.4,
                                ease: EASE_SPRING,
                                overwrite: true
                            });
                        });
                    }
                }
            }
        });

        // ── Per-Panel Reveal Animations (scrub-triggered as each panel enters) ──
        fbItems.forEach((item, index) => {
            const line = item.querySelector('.fb-line-divider');
            const headings = item.querySelectorAll('.fb-heading');
            const desc = item.querySelector('.fb-desc');
            const btn = item.querySelector('.btn-primary');
            const imgWrapper = item.querySelector('.fb-img-wrapper');
            const imgEl = item.querySelector('.fb-img-wrapper img');
            const videoCard = item.querySelector('.fb-video-card');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    containerAnimation: fbHorizontalTween,
                    start: "left 80%",
                    end: "left 20%",
                    toggleActions: "play none none reverse",
                }
            });

            // Line divider expands from left
            if (line) {
                tl.fromTo(line,
                    { scaleX: 0, transformOrigin: "left center" },
                    { scaleX: 1, duration: 1.2, ease: "expo.out" },
                    0
                );
            }

            // Headings cascade in with stagger and skew
            if (headings.length) {
                headings.forEach((heading, idx) => {
                    tl.fromTo(heading,
                        { x: 60, opacity: 0, skewX: -3 },
                        { x: 0, opacity: 1, skewX: 0, duration: 1.2, ease: "power4.out" },
                        0.15 + idx * 0.08
                    );
                });
            }

            // Description fades in
            if (desc) {
                tl.fromTo(desc,
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 0.85, duration: 1, ease: "power3.out" },
                    0.35
                );
            }

            // Button springs in
            if (btn) {
                tl.fromTo(btn,
                    { y: 20, opacity: 0, scale: 0.92 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: EASE_SPRING },
                    0.45
                );
            }

            // Image: Ken Burns parallax — starts zoomed & shifted, settles to neutral
            if (imgEl) {
                tl.fromTo(imgEl,
                    { scale: 1.15, x: "5%" },
                    { scale: 1, x: "0%", duration: 2, ease: "power2.out" },
                    0
                );
            }

            // Video card: delayed spring entrance (desktop only)
            if (videoCard && window.innerWidth > 1024) {
                tl.fromTo(videoCard,
                    { y: 60, opacity: 0, scale: 0.85, rotation: 3 },
                    { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1.4, ease: EASE_SPRING },
                    0.6
                );
            }
        });


        // ── Dot click navigation ──
        fbProgressDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                // Calculate target scroll position for this dot
                const st = fbHorizontalTween.scrollTrigger;
                const targetProgress = i / (fbTotal - 1);
                const scrollTo = st.start + (st.end - st.start) * targetProgress;
                lenis.scrollTo(scrollTo, { duration: 1.8 });
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

    // ===== BLOG GALLERY LIGHTBOX =====
    const blogGalleryItems = document.querySelectorAll('.blog-gallery-item');
    const blogLb = document.getElementById('galleryLightbox');
    const blogLbImg = document.getElementById('galleryLbImg');
    const blogLbCounter = document.getElementById('galleryLbCounter');
    
    if (blogGalleryItems.length && blogLb) {
        const imgs = Array.from(blogGalleryItems).map(i => i.querySelector('img').src.replace('w=600', 'w=1600'));
        let cur = 0;
        
        const showImg = (idx) => { 
            cur = (idx + imgs.length) % imgs.length; 
            blogLbImg.src = imgs[cur]; 
            blogLbCounter.textContent = (cur + 1) + ' / ' + imgs.length; 
        };
        
        const openLb = (idx) => { 
            showImg(idx); 
            blogLb.classList.add('active'); 
            lenis.stop(); // Stop Lenis scroll
        };
        
        const closeLb = () => { 
            blogLb.classList.remove('active'); 
            lenis.start(); // Resume Lenis scroll
        };
        
        blogGalleryItems.forEach(item => item.addEventListener('click', () => openLb(parseInt(item.dataset.galleryIdx))));
        
        const closeBtnLb = blogLb.querySelector('.gallery-lb-close');
        if (closeBtnLb) closeBtnLb.addEventListener('click', closeLb);
        
        const prevBtnLb = blogLb.querySelector('.gallery-lb-prev');
        if (prevBtnLb) prevBtnLb.addEventListener('click', () => showImg(cur - 1));
        
        const nextBtnLb = blogLb.querySelector('.gallery-lb-next');
        if (nextBtnLb) nextBtnLb.addEventListener('click', () => showImg(cur + 1));
        
        blogLb.addEventListener('click', e => { if (e.target === blogLb) closeLb(); });
        
        document.addEventListener('keydown', e => { 
            if (!blogLb.classList.contains('active')) return; 
            if (e.key === 'Escape') closeLb(); 
            if (e.key === 'ArrowLeft') showImg(cur - 1); 
            if (e.key === 'ArrowRight') showImg(cur + 1); 
        });
    }

    // ===== BLOG LISTING REVEAL =====
    const listingCards = gsap.utils.toArray('.blogs-card');
    if (listingCards.length) {
        gsap.fromTo(listingCards, { y: 50, opacity: 0 }, {
            y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'expo.out',
            scrollTrigger: { 
                trigger: '.blogs-grid', 
                start: 'top 85%', 
                toggleActions: 'play none none reverse' 
            }
        });
    }

    // ===== ABOUT PREMIUM SLIDESHOW =====
    const aboutSlides = document.querySelectorAll('.about-slide');
    const aboutIndicators = document.querySelectorAll('.about-slide-controls .indicator');
    const btnPrev = document.querySelector('.slide-prev');
    const btnNext = document.querySelector('.slide-next');
    
    if (aboutSlides.length > 0) {
        let currentSlide = 0;
        let slideInterval;
        const totalSlides = aboutSlides.length;

        function goToSlide(index) {
            aboutSlides[currentSlide].classList.remove('active');
            if(aboutIndicators.length > 0) aboutIndicators[currentSlide].classList.remove('active');
            
            currentSlide = (index + totalSlides) % totalSlides;
            
            aboutSlides[currentSlide].classList.add('active');
            if(aboutIndicators.length > 0) aboutIndicators[currentSlide].classList.add('active');
            resetInterval();
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }

        if (btnNext) btnNext.addEventListener('click', nextSlide);
        if (btnPrev) btnPrev.addEventListener('click', prevSlide);

        aboutIndicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => goToSlide(index));
        });

        // Initialize autoplay
        resetInterval();
    }

    // ===== FOOTER ENTRANCE REVEAL =====
    // Move to end to ensure ScrollTrigger calculates positions after all other sections (like pinned horizontal scroll)
    if (document.querySelector('.main-footer')) {
        // Heading section
        gsap.from('.footer-heading-section', {
            y: 40,
            opacity: 0,
            duration: 1.5,
            ease: "expo.out",
            scrollTrigger: {
                trigger: '.main-footer',
                start: "top 90%",
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
                    start: "top 92%",
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
    }

    // Make blog cards clickable
    const blogCardsClick = document.querySelectorAll('.blog-card');
    blogCardsClick.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // If the click was on the button itself, don't interfere
            if (e.target.closest('.btn-primary')) return;
            
            const link = card.querySelector('.btn-primary');
            if (link) {
                window.location.href = link.getAttribute('href');
            }
        });
    });

    // Final refresh to lock in all trigger positions
    ScrollTrigger.refresh();
});
