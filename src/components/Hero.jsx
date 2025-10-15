'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * 🔧 SIMPLE KNOBS (edit these)
 *
 * Each entry applies when window.innerWidth <= max.
 * If none match, the last object (Infinity) is used.
 *
 * startY:       starting vertical offset in %, more negative = higher
 * scaleStart:   starting scale (0.0–1.0)
 * movement:     mouse drift strength while small
 * maxVideoPx:   intrinsic desktop video max width (px)
 */
const BREAKPOINTS = [
  { max: 1000, startY: -135, scaleStart: 0.33, movement: 450, maxVideoPx: 900  },
  { max: 1100, startY: -130, scaleStart: 0.30, movement: 500, maxVideoPx: 1000 },
  { max: 1200, startY: -125, scaleStart: 0.28, movement: 550, maxVideoPx: 1100 },
  { max: 1300, startY: -120, scaleStart: 0.26, movement: 600, maxVideoPx: 1150 },
{ max: Infinity, startY: -105, scaleStart: 0.25, movement: 650, maxVideoPx: 1600 },
];

/** Desktop threshold (px) */
const DESKTOP_MIN = 900;

export default function VideoDriftScroller() {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const videoContainerRef = useRef(null);

  // RAF + Lenis/GSAP sync
  const rafRef = useRef(null);
  const lenisRef = useRef(null);
  const tickerFnRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    const videoContainer = videoContainerRef.current;
    if (!root || !intro || !videoContainer) return;

    const isDesktop = () => window.innerWidth >= DESKTOP_MIN;

    const getCfg = () => {
      const w = window.innerWidth;
      for (const bp of BREAKPOINTS) {
        if (w <= bp.max) return bp;
      }
      return BREAKPOINTS[BREAKPOINTS.length - 1];
    };

    // ---- Lenis (desktop only) ----
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

    // ---- State ----
    const cfg = getCfg();

    // expose max video width to CSS via a variable
    root.style.setProperty('--video-max', `${cfg.maxVideoPx}px`);

    const state = {
      scrollProgress: 0,
      initialTranslateY: cfg.startY,
      currentTranslateY: cfg.startY,
      movementMultiplier: cfg.movement,
      scale: cfg.scaleStart,
      targetMouseX: 0,
      currentMouseX: 0,
    };

    // initial transform
    videoContainer.style.transform =
      `translateY(${state.currentTranslateY}%) translateX(0px) scale(${state.scale})`;

    // ---- Resize ----
    const onResize = () => {
      const next = getCfg();

      // update css var for width clamp
      root.style.setProperty('--video-max', `${next.maxVideoPx}px`);

      state.movementMultiplier = next.movement;
      state.initialTranslateY = next.startY;

      if (state.scrollProgress === 0) {
        state.currentTranslateY = next.startY;
        state.scale = next.scaleStart;
        videoContainer.style.transform =
          `translateY(${state.currentTranslateY}%) translateX(0px) scale(${state.scale})`;
      }
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // ---- ScrollTrigger (desktop only) ----
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
            // vertical position: startY -> 0
            state.currentTranslateY = gsap.utils.interpolate(
              state.initialTranslateY, 0, state.scrollProgress
            );
            // scale: scaleStart -> 1
            state.scale = gsap.utils.interpolate(cfg.scaleStart, 1, state.scrollProgress);
          },
        },
      });
    }

    // ---- Mouse move (desktop only) ----
    const onMouse = (e) => {
      if (!isDesktop()) return;
      state.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
    };
    document.addEventListener('mousemove', onMouse);

    // ---- RAF loop ----
    const animate = () => {
      if (isDesktop()) {
        const { scale, targetMouseX, currentMouseX, currentTranslateY, movementMultiplier } = state;

        const scaledMovementMultiplier = (1 - scale) * movementMultiplier;
        const maxX = scale < 0.95 ? targetMouseX * scaledMovementMultiplier : 0;

        state.currentMouseX = gsap.utils.interpolate(currentMouseX, maxX, 0.05);

        videoContainer.style.transform =
          `translateY(${currentTranslateY}%) translateX(${state.currentMouseX}px) scale(${scale})`;
      } else {
        // clear transforms on mobile to let CSS layout handle it
        videoContainer.style.transform = '';
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // ---- Cleanup ----
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
          preload="metadata"
          className={styles.video}
        />
      </div>
    </div>
  </div>



  {/* hero title anchored at bottom */}
  <h1 className={styles.mobileRole}>
    <span>CREATIVE</span>
    <span>DEVELOPER</span>
  </h1>
</section>



      {/* DESKTOP HERO — headline near bottom */}
      <section className={`${styles.section} ${styles.hero}`}>
        <h1 className={styles.headline}>
          <span className={styles.lineLeft}>Creative</span>
          <span className={styles.lineRight}>Developer</span>
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
        </div>

      </section>
    </div>
  );
}
