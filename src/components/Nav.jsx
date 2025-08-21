'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import Image from 'next/image';
import HoverSplitText from '@/components/HoverSplitText';

export default function Nav({ containerRef }) {
  const pathname = usePathname();

  const navRef = useRef(null);
  const labelRef = useRef(null);
  const hamburgerRef = useRef(null);
  const overlayRef = useRef(null);
  const overlayContentRef = useRef(null);
  const mediaRef = useRef(null);

  // timelines
  const tlRef = useRef(null);      // master (reversible)
  const linesTlRef = useRef(null); // open-only SplitText reveal

  const isOpen = useRef(false);

  useEffect(() => {
    gsap.registerPlugin(CustomEase, SplitText);
    CustomEase.create('hop', '.87,0,.13,1');
    gsap.defaults({ overwrite: 'auto' });
    document.body.classList.remove('menu-open', 'menu-closing');

    const root = navRef.current;
    const label = labelRef.current;

    gsap.from(root.querySelector(".menu-bar"), {
  y: -40,
  opacity: 0,
  duration: 0.8,
  ease: "power4.out",
  delay: 0.3, // match your Copy delay
  clearProps: "all",
});

gsap.from(
  root.querySelectorAll(".menu-logo, .menu-toggle-btn"),
  {
    y: -20,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
    stagger: 0.08,
    delay: 0.4, // slightly after the bar itself
    clearProps: "all",
  }
);

    const hamburger = hamburgerRef.current;
    const overlay = overlayRef.current;
    const overlayContent = overlayContentRef.current;
    const media = mediaRef.current;
    const copyCols = root.querySelectorAll('.menu-col');

    const fontsReady = 'fonts' in document ? document.fonts.ready : Promise.resolve();

    // SplitText sets (rebuilt on route change)
    let splitSets = [];

    const buildSplits = () => {
      // revert previous splits
      splitSets.forEach(set => set.forEach(s => s?.revert?.()));
      splitSets = [];

      const sets = [];
      copyCols.forEach(col => {
        const els = col.querySelectorAll('a, p, span.active-link');
        const splits = [];
        els.forEach(el => {
          const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
          gsap.set(s.lines, { y: '-110%' }); // hidden baseline
          splits.push(s);
        });
        sets.push(splits);
      });
      splitSets = sets;
    };

    const resetLinesInstant = () => {
      splitSets.forEach(set => {
        const lines = set.flatMap(s => s.lines);
        gsap.set(lines, { y: '-110%' });
      });
    };

    // Master timeline = structure + media fade
    function buildMasterTl() {
      const containerEl = containerRef?.current || document.querySelector('.container');

      tlRef.current?.kill();
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => { isOpen.current = true; },
        onReverseComplete: () => {
          isOpen.current = false;
          document.body.classList.remove('menu-open', 'menu-closing'); // ← add this
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      });

      // closed states
      tl.set(overlay, { clipPath: 'polygon(0% 0%,100% 0%,100% 0%,0% 0%)' });
      tl.set(overlayContent, { yPercent: -50 });
      tl.set(media, { opacity: 0 });
      tl.set(copyCols, { opacity: 1 });

      // OPEN (0s)
      tl.to(containerEl,    { y: '100svh', duration: 0.85, ease: 'hop' }, 0)
        .to(overlay,        { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 0.85, ease: 'hop' }, 0)
        .to(overlayContent, { yPercent: 0, duration: 0.85, ease: 'hop' }, 0)
        .to(media,          { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.05);

      // minor UI toggles managed by master

      tlRef.current = tl;
    }

    // Open-only: line reveal (we will start this on open each time)
    const playLineReveal = () => {
      linesTlRef.current?.kill();
      const lines = splitSets.flatMap(set => set.flatMap(s => s.lines));
      if (!lines?.length) return;
      linesTlRef.current = gsap.to(lines, {
        y: '0%',
        duration: 1.5,       // snappy
        ease: 'hop',
        stagger: -0.055,      // tighter cascade
        delay: 0           // just after motion starts
      });
    };

    function lockScroll() {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    // OPEN: reset lines + gate underline, then play master + reveal lines, then allow underline
    function openMenu() {
      lockScroll();

      // hide underline while intro starts, and reset SplitText lines for a fresh reveal
      root.classList.add('no-underline');
      resetLinesInstant();

      if (!tlRef.current) buildMasterTl();

      // restart master from the beginning for consistent timing
      tlRef.current.time(0).timeScale(1).play();

      // kick the lines reveal
      playLineReveal();

      // let underline appear shortly AFTER the lines start moving
      gsap.delayedCall(1.3, () => {
        root.classList.remove('no-underline');
      });

      // pre-decode image (first-open jank guard)
      const img = media?.querySelector('img');
      if (img) {
        img.loading = 'eager';
        img.decoding = 'async';
        img.setAttribute('fetchpriority', 'high');
        try { img.decode?.(); } catch {}
      }
    }

    // CLOSE: just shove up (reverse master). Don’t touch lines/underline/media explicitly.
    function closeMenu() {
      if (!tlRef.current) return;
      tlRef.current.timeScale(1.2).reverse(); // slightly faster close
    }

    function instantClose() {
      // hard-close for route changes (keep this behavior)
      linesTlRef.current?.kill();

      const containerEl = containerRef?.current || document.querySelector('.container');
      gsap.set(containerEl, { y: '0svh' });
      gsap.set(overlay, { clipPath: 'polygon(0% 0%,100% 0%,100% 0%,0% 0%)' });
      gsap.set(overlayContent, { yPercent: -50 });
      gsap.set(media, { opacity: 0 });



      document.body.classList.remove('menu-open', 'menu-closing'); // ← keep this
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';

      tlRef.current?.kill();
      tlRef.current = null;
    }

function onToggle() {
  if (!tlRef.current) buildMasterTl();


  if (tlRef.current.reversed() || tlRef.current.progress() === 0) {
    // OPEN
    document.body.classList.add("menu-open");  // <-- instant white logo/hamburger
    openMenu();
  } else {
    // CLOSE
    document.body.classList.remove("menu-open");
    document.body.classList.add("menu-closing"); // <-- instant revert to black

    tlRef.current.timeScale(1.2).reverse().eventCallback("onReverseComplete", () => {
      document.body.classList.remove("menu-closing");
    });
  }
}


    const btn = root.querySelector('.menu-toggle-btn');


    let cancelled = false;
    (async () => {
      await fontsReady;
      if (cancelled) return;

      buildSplits();
      buildMasterTl();

      btn.addEventListener('click', onToggle);
    })();

    return () => {
      btn.removeEventListener('click', onToggle);
      splitSets.forEach(set => set.forEach(s => s?.revert?.()));
      linesTlRef.current?.kill();
      tlRef.current?.kill();
      tlRef.current = null;
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      cancelled = true;
    };
  }, [containerRef, pathname]);

  // active vs link
  const ActiveOrLink = ({ href, children, noUnderline = false }) => {
    const isActive = pathname === href;
    if (isActive) {
      return (
        <span
          className={`active-link${noUnderline ? ' active-link--no-underline' : ''}`}
          aria-current="page"
        >
          {children}
        </span>
      );
    }
    return <Link href={href}>{children}</Link>;
  };

  return (
    <nav ref={navRef}>
      <div className="menu-bar">
        <div className="menu-logo">
          <ActiveOrLink href="/" noUnderline>
            <img src="/logo.png" alt="Home" />
          </ActiveOrLink>
        </div>

        <div className="menu-toggle-btn" data-no-transition="true">
          <div className="menu-toggle-label"><p ref={labelRef}>Menu</p></div>
          <div className="menu-hamburger-icon" ref={hamburgerRef}><span /><span /></div>
        </div>
      </div>

      <div className="menu-overlay" ref={overlayRef}>
        <div className="menu-overlay-content" ref={overlayContentRef}>
          <div className="menu-media-wrapper" ref={mediaRef} style={{ position: 'relative' }}>
            <Image src="/test.png" alt="" fill priority sizes="100vw" placeholder="empty" />
          </div>

          <div className="menu-content-wrapper">
            <div className="menu-content-main" key={pathname}>
              <div className="menu-col">
                <div className="menu-link"><ActiveOrLink href="/">Home</ActiveOrLink></div>
                <div className="menu-link"><ActiveOrLink href="/about">About</ActiveOrLink></div>
                <div className="menu-link"><ActiveOrLink href="/projects">Projects</ActiveOrLink></div>
                <div className="menu-link"><ActiveOrLink href="/connect">Connect</ActiveOrLink></div>
              </div>

              <div className="menu-col">
                <div className="menu-tag"><ActiveOrLink href="/tags/web-animations">Web Animations</ActiveOrLink></div>
                <div className="menu-tag"><ActiveOrLink href="/tags/interactive-media">Interactive Media</ActiveOrLink></div>
                <div className="menu-tag"><ActiveOrLink href="/tags/motion-craft">Motion Craft</ActiveOrLink></div>
              </div>
            </div>

            <div className="menu-footer">
              <div className="menu-col"><p>Vancouver, BC</p></div>
              <div className="menu-col"><p>wesleytingdev@gmail.com</p></div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
