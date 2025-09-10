'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function VideoDriftScroller() {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const videoContainerRef = useRef(null);
  const videoTitleRef = useRef(null); // wrapper for the two <p> nodes

  // RAF + Lenis/GSAP sync
  const rafRef = useRef(null);
  const lenisRef = useRef(null);
  const tickerFnRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    const videoContainer = videoContainerRef.current;
    const videoTitleEl = videoTitleRef.current;
    if (!root || !intro || !videoContainer || !videoTitleEl) return;

    const isDesktop = () => window.innerWidth >= 900;
    const titlePs = Array.from(videoTitleEl.querySelectorAll('p'));

    // ---- Lenis ----
    if (isDesktop()) {
      const lenis = new Lenis();
      lenisRef.current = lenis;

      lenis.on('scroll', ScrollTrigger.update);

      const tickerFn = (time) => {
        lenis.raf(time * 1000);
      };
      tickerFnRef.current = tickerFn;

      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    }

    // ---- Breakpoints ----
    const breakpoints = [
      { maxWidth: 1000, translateY: -135, movMultiplier: 450 },
      { maxWidth: 1100, translateY: -130, movMultiplier: 500 },
      { maxWidth: 1200, translateY: -125, movMultiplier: 550 },
      { maxWidth: 1300, translateY: -120, movMultiplier: 600 },
    ];

    const getInitialValues = () => {
      const width = window.innerWidth;
      for (const bp of breakpoints) {
        if (width <= bp.maxWidth) {
          return { translateY: bp.translateY, movementMultiplier: bp.movMultiplier };
        }
      }
      return { translateY: -105, movementMultiplier: 650 };
    };

    const initial = getInitialValues();

    const state = {
      scrollProgress: 0,
      initialTranslateY: initial.translateY,
      currentTranslateY: initial.translateY,
      movementMultiplier: initial.movementMultiplier,
      scale: 0.25,
      fontSize: 80,
      gap: 2,
      targetMouseX: 0,
      currentMouseX: 0,
    };

    // initial transforms
    videoContainer.style.transform =
      `translateY(${state.currentTranslateY}%) translateX(0px) scale(${state.scale})`;
    videoContainer.style.gap = `${state.gap}em`;
    titlePs.forEach((p) => (p.style.fontSize = `${state.fontSize}px`));

    // resize
    const onResize = () => {
      const nv = getInitialValues();
      state.initialTranslateY = nv.translateY;
      state.movementMultiplier = nv.movementMultiplier;
      if (state.scrollProgress === 0) {
        state.currentTranslateY = nv.translateY;
        videoContainer.style.transform =
          `translateY(${state.currentTranslateY}%) translateX(0px) scale(${state.scale})`;
      }
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // scrolltrigger
    let st;
    if (isDesktop()) {
      st = gsap.timeline({
        scrollTrigger: {
          trigger: intro,
          start: 'top bottom',
          end: 'top 10%',
          scrub: true,
          onUpdate: (self) => {
            state.scrollProgress = self.progress;

            state.currentTranslateY = gsap.utils.interpolate(
              state.initialTranslateY, 0, state.scrollProgress
            );
            state.scale = gsap.utils.interpolate(0.25, 1, state.scrollProgress);
            state.gap = gsap.utils.interpolate(2, 1, state.scrollProgress);

            if (state.scrollProgress <= 0.4) {
              const p = state.scrollProgress / 0.4;
              state.fontSize = gsap.utils.interpolate(80, 40, p);
            } else {
              const p = (state.scrollProgress - 0.4) / 0.6;
              state.fontSize = gsap.utils.interpolate(40, 20, p);
            }
          },
        },
      });
    }

    // mouse move
    const onMouse = (e) => {
      if (!isDesktop()) return;
      state.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
    };
    document.addEventListener('mousemove', onMouse);

    // RAF loop
    const animate = () => {
      if (isDesktop()) {
        const {
          scale, targetMouseX, currentMouseX, currentTranslateY, fontSize, gap, movementMultiplier,
        } = state;

        const scaledMovementMultiplier = (1 - scale) * movementMultiplier;
        const maxX = scale < 0.95 ? targetMouseX * scaledMovementMultiplier : 0;

        state.currentMouseX = gsap.utils.interpolate(currentMouseX, maxX, 0.05);

        videoContainer.style.transform =
          `translateY(${currentTranslateY}%) translateX(${state.currentMouseX}px) scale(${scale})`;

        videoContainer.style.gap = `${gap}em`;
        titlePs.forEach((p) => (p.style.fontSize = `${fontSize}px`));
      } else {
        videoContainer.style.transform = '';
        videoContainer.style.gap = '';
        titlePs.forEach((p) => (p.style.fontSize = ''));
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // cleanup
    return () => {
      document.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (st) st.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current);
      lenisRef.current = null;
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      {/* MOBILE-ONLY HERO (video first, then text) */}
      <section className={`${styles.section} ${styles.mobileHero}`}>
        <div className={styles.mobileVideo}>
          <div className={styles.videoPreview}>
            <div className={styles.videoWrapper}>
              <video
                src="/video.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className={styles.video}
              />
            </div>
          </div>
        </div>
        <h1 className={styles.mobileRole}>WEB DEVELOPER</h1>
        <p className={styles.mobileTagline}>Crafting experiences online</p>
      </section>

{/* DESKTOP HERO — headline near bottom */}
<section className={`${styles.section} ${styles.hero}`}>
  <h1 className={styles.headline}>
    <span className={styles.lineLeft}>BUILD DIGITAL SOLUTIONS</span>
    <span className={styles.lineRight}>WITH REAL RESULTS.</span>
  </h1>

  <div className={styles.cornerLeft}>WESLEY TING</div>
  <div className={styles.cornerRight}>WEB DEVELOPER</div>
</section>


      {/* INTRO with the animated video (desktop) */}
      <section ref={introRef} className={`${styles.section} ${styles.intro}`}>
        <div ref={videoContainerRef} className={styles.videoContainerDesktop}>
          <div className={styles.videoPreview}>
            <div className={styles.videoWrapper}>
              <video
                src="/video.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className={styles.video}
              />
            </div>
          </div>
          <div ref={videoTitleRef} className={styles.videoTitle}>
            <p>PRO Showreel</p>
            <p>2023 - 2024</p>
          </div>
        </div>

        {/* Optional secondary mobile block */}
        <div className={styles.videoContainerMobile}>
          <div className={styles.videoPreview}>
            <div className={styles.videoWrapper}>
              <video
                src="/video.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className={styles.video}
              />
            </div>
          </div>
          <div className={styles.videoTitle}>
            <p>PRO Showreel</p>
            <p>2023 - 2024</p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.outro}`}>
        <p>Delve into coding without clutter.</p>
      </section>
    </div>
  );
}
