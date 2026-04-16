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
            y: "-50%",
            duration: 0.8,
            ease: "power2.in",
            delay: 0.8
        })
        .to(".preloader", {
            yPercent: -100,
            duration: 1.2,
            ease: "expo.inOut"
        }, "-=0.2");

    // Initialize Lenis for Smooth Scrolling (Lando Norris style buttery scroll)
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 0.9,
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
    // Select all clip-reveal children to animate them up
    const clipReveals = gsap.utils.toArray('.panel:not(.section-machines) .clip-reveal > *');
    clipReveals.forEach(elem => {
        gsap.to(elem, {
            y: "0%",
            duration: 2.2,
            ease: "expo.out",
            scrollTrigger: {
                trigger: elem.parentElement,
                start: "top 92%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Image Clip Reveals
    const imgReveals = gsap.utils.toArray('.panel:not(.section-machines) .clip-img-reveal');
    imgReveals.forEach(imgCont => {
        gsap.fromTo(imgCont,
            { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" },
            {
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                duration: 2,
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

    // Horizontal Scroll for Machines Section
    const machinesWrapper = document.querySelector(".machines-wrapper");
    const machinePanels = gsap.utils.toArray(".machine-panel");
    const progressBar = document.querySelector(".scroll-progress-bar");

    // Create the horizontal scroll tween on the wrapper
    const scrollTween = gsap.to(machinesWrapper, {
        x: () => -(machinesWrapper.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
            id: "machinesST",
            trigger: ".section-machines",
            pin: true,
            scrub: 1.2,
            snap: 1 / (machinePanels.length - 1),
            end: () => "+=" + (machinesWrapper.scrollWidth - window.innerWidth),
            onUpdate: (self) => {
                gsap.set(progressBar, { width: (self.progress * 100) + "%" });
            }
        }
    });

    // Add intentional inner animations tied to the horizontal container
    machinePanels.forEach((panel, i) => {
        // Image Parallax Effect
        const img = panel.querySelector(".machine-img");
        if (img) {
            gsap.fromTo(img,
                { xPercent: -15 },
                {
                    xPercent: 15,
                    ease: "none",
                    scrollTrigger: {
                        trigger: panel,
                        containerAnimation: scrollTween,
                        start: "left right",
                        end: "right left",
                        scrub: true
                    }
                }
            );
        }

        // Clip-path reveal for images
        const imgCont = panel.querySelector(".clip-img-reveal");
        if (imgCont) {
            gsap.fromTo(imgCont,
                { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" },
                {
                    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                    duration: 1.5,
                    ease: "expo.out",
                    scrollTrigger: i === 0 ? {
                        trigger: ".section-machines",
                        start: "top 75%",
                        toggleActions: "play none none reverse"
                    } : {
                        trigger: panel,
                        containerAnimation: scrollTween,
                        start: "left 75%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // Text reveals
        const textElements = panel.querySelectorAll(".clip-reveal > *");
        if (textElements.length) {
            gsap.fromTo(textElements,
                { y: "110%" },
                {
                    y: "0%",
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: i === 0 ? {
                        trigger: ".section-machines",
                        start: "top 75%",
                        toggleActions: "play none none reverse"
                    } : {
                        trigger: panel,
                        containerAnimation: scrollTween,
                        start: "left 75%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
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

    // Refresh ScrollTrigger
    ScrollTrigger.refresh();

    // Hero Landing Animation
    const tlHero = gsap.timeline({ paused: true });
    tlHero.from(".hero-subheading", { opacity: 0, y: 30, duration: 1.5, ease: "expo.out", delay: 0.1 })
        .from(".hero-heading .clip-reveal > *", { y: "110%", duration: 2, stagger: 0.15, ease: "expo.out" }, "-=1.2")
        .from(".hero-socials .social-icon", { opacity: 0, x: -30, duration: 1, stagger: 0.1, ease: "power3.out" }, "-=1.5");

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
