// components/PageTransition.jsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";
import Logo from "./Logo";

const DUR = {
  cover: 0.4,
  reveal: 0.4,
  draw: 1.2,
  fill: 0.6,
  blockStagger: 0.03,
};

const LOGO_STAGGER = 0.0;

export default function PageTransition({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const overlayRef = useRef(null);
  const logoOverlayRef = useRef(null);
  const logoContainerRef = useRef(null);
  const logoRef = useRef(null);
  const blocksRef = useRef([]);
  const isTransitioning = useRef(false);
  const pathLengthsRef = useRef([]);
  const revealTimeoutRef = useRef(null);

  // ----- helpers -----
  const ensureMeasured = useCallback(() => {
    const svg = logoRef.current;
    if (!svg) return null;
    const paths = svg.querySelectorAll("path");
    if (!paths.length) return paths;

    if (pathLengthsRef.current.length !== paths.length || pathLengthsRef.current.length === 0) {
      pathLengthsRef.current = Array.from(paths).map((p) => p.getTotalLength());
    }
    return paths;
  }, []);

  const resetLogoForDraw = useCallback(() => {
    const paths = ensureMeasured();
    if (!paths || !paths.length) return paths;

    gsap.killTweensOf(paths);
    paths.forEach((p, i) => {
      gsap.set(p, {
        strokeDasharray: pathLengthsRef.current[i],
        strokeDashoffset: pathLengthsRef.current[i],
        fill: "transparent",
      });
    });

    // force reflow so draw always starts from hidden
    paths[0]?.getBoundingClientRect();
    return paths;
  }, [ensureMeasured]);

  const revealPage = useCallback(() => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    // reveal the black blocks
    gsap.killTweensOf(blocksRef.current);
    gsap.set(blocksRef.current, { scaleX: 1, transformOrigin: "right" });

    gsap.to(blocksRef.current, {
      scaleX: 0,
      duration: DUR.reveal,
      stagger: DUR.blockStagger,
      ease: "power3.out",
      transformOrigin: "right",
      onStart: () => {
        // mark the app as visible (if a flash happened earlier, this guarantees it now)
        document.body.classList.remove("show-splash");
        document.body.classList.add("app-ready");
      },
      onComplete: () => {
        isTransitioning.current = false;
        overlayRef.current && (overlayRef.current.style.pointerEvents = "none");
        if (logoOverlayRef.current) {
          logoOverlayRef.current.style.pointerEvents = "none";
          logoOverlayRef.current.style.opacity = 0;
        }
      },
    });

    // safety fallback
    revealTimeoutRef.current = setTimeout(() => {
      const firstBlock = blocksRef.current[0];
      if (firstBlock && gsap.getProperty(firstBlock, "scaleX") > 0) {
        gsap.to(blocksRef.current, {
          scaleX: 0,
          duration: DUR.reveal * 0.6,
          ease: "power3.out",
          transformOrigin: "right",
          onComplete: () => {
            isTransitioning.current = false;
            overlayRef.current && (overlayRef.current.style.pointerEvents = "none");
            if (logoOverlayRef.current) {
              logoOverlayRef.current.style.pointerEvents = "none";
              logoOverlayRef.current.style.opacity = 0;
            }
            document.body.classList.remove("show-splash");
            document.body.classList.add("app-ready");
          },
        });
      }
    }, 900);
  }, []);

  const playInitialIntro = useCallback(() => {
    // splash must be interactive and visible
    overlayRef.current && (overlayRef.current.style.pointerEvents = "auto");
    logoOverlayRef.current && (logoOverlayRef.current.style.pointerEvents = "auto");

    const paths = resetLogoForDraw();
    if (!logoOverlayRef.current || !logoRef.current || !paths?.length) {
      // if anything is missing, just reveal immediately
      revealPage();
      return;
    }

    const start = "fonts" in document ? document.fonts.ready : Promise.resolve();

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        // after logo draw, proceed to reveal blocks and app
        logoOverlayRef.current && (logoOverlayRef.current.style.pointerEvents = "none");
        revealPage();
      },
    });

    start.then(() => {
      // ensure splash is visible at the moment we start animating
      document.body.classList.add("show-splash");
      gsap.set(logoOverlayRef.current, { opacity: 1 });
      gsap.set(logoContainerRef.current, { opacity: 1 }); // use the ref

      tl.to(
        paths,
        {
          strokeDashoffset: 0,
          duration: DUR.draw,
          ease: "power2.inOut",
          stagger: LOGO_STAGGER,
        },
        0
      )
        .to(paths, { fill: "white", duration: DUR.fill, stagger: LOGO_STAGGER }, "-=0.4")
        .set(blocksRef.current, { scaleX: 1, transformOrigin: "right" }, "-=0.05")
   .to(logoOverlayRef.current, { opacity: 0, duration: 0.2, onComplete: () => {
       gsap.set(logoContainerRef.current, { opacity: 0 }); // hide again when overlay fades
     }});
    });
  }, [revealPage, resetLogoForDraw]);

  const coverPage = useCallback(
    (url) => {
         document.body.classList.add("show-splash");
   document.body.classList.remove("app-ready");
      overlayRef.current && (overlayRef.current.style.pointerEvents = "auto");
      logoOverlayRef.current && (logoOverlayRef.current.style.pointerEvents = "auto");

      try {
        window.sessionStorage.setItem("skipIntroOnce", "1");
      } catch {}

      // fresh state every time we cover
      gsap.killTweensOf(blocksRef.current);
      gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

      const paths = resetLogoForDraw();

      const tl = gsap.timeline({
        onComplete: () => router.push(url),
      });

      tl.to(blocksRef.current, {
        scaleX: 1,
        duration: DUR.cover,
        stagger: DUR.blockStagger,
        ease: "power3.out",
        transformOrigin: "left",
      })
        .set(logoOverlayRef.current, { opacity: 1 }, "-=0.15")
        .set(logoContainerRef.current, { opacity: 1 }, "<")
        .to(
          paths ?? [],
          {
            strokeDashoffset: 0,
            duration: DUR.draw,
            ease: "power2.inOut",
            stagger: LOGO_STAGGER,
          },
          "-=0.4"
        )
        .to(
          paths ?? [],
          { fill: "white", duration: DUR.fill, ease: "power2.out", stagger: LOGO_STAGGER },
          "-=0.5"
        )
   .to(logoOverlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.out",
     onComplete: () => {
      gsap.set(logoContainerRef.current, { opacity: 0 }); // hide after cover draw ends
     }
   });
    },
    [router, resetLogoForDraw]
  );

  const handleRouteChange = useCallback(
    (url) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;
      coverPage(url);
    },
    [coverPage]
  );

  // ----- mount/update -----
  useEffect(() => {
    // create 12 blocks (scoped class name inside .transition-overlay)
    if (overlayRef.current) {
      overlayRef.current.innerHTML = "";
      blocksRef.current = [];
      for (let i = 0; i < 12; i++) {
        const block = document.createElement("div");
        block.className = "transition-block"; // NOTE: renamed from 'block' to avoid global collisions
        overlayRef.current.appendChild(block);
        blocksRef.current.push(block);
      }
    }

    gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

    // measure logo path lengths (initial)
    if (logoRef.current) {
      const paths = logoRef.current.querySelectorAll("path");
      pathLengthsRef.current = Array.from(paths).map((p) => p.getTotalLength());
      paths.forEach((p, i) => {
        gsap.set(p, {
          strokeDasharray: pathLengthsRef.current[i],
          strokeDashoffset: pathLengthsRef.current[i],
          fill: "transparent",
        });
      });
    }

    // decide intro vs skip
    const skipIntroOnce =
      typeof window !== "undefined" && window.sessionStorage.getItem("skipIntroOnce") === "1";

    if (skipIntroOnce) {
      try { window.sessionStorage.removeItem("skipIntroOnce"); } catch {}
      // we still ensure the splash class is removed if skipping
      document.body.classList.remove("show-splash");
      document.body.classList.add("app-ready");
      revealPage();
    } else {
      // ensure splash is active before running the intro
      document.body.classList.add("show-splash");
      playInitialIntro();
    }

    // intercept internal links
    const onAnchorClick = (e) => {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }
      if (
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        e.button !== 0 || e.currentTarget.target === "_blank"
      ) {
        return;
      }
      const href = e.currentTarget.href;
      if (!href) return;
      const url = new URL(href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      const nextPath = url.pathname;
      if (nextPath !== pathname) handleRouteChange(nextPath);
    };

    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => link.addEventListener("click", onAnchorClick));

    return () => {
      links.forEach((link) => link.removeEventListener("click", onAnchorClick));
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [pathname, revealPage, playInitialIntro, handleRouteChange]);

  return (
    <>
      {/* cover/reveal bars */}
      <div ref={overlayRef} className="transition-overlay" />

      {/* logo overlay (visible by default via CSS while body has .show-splash) */}
      <div ref={logoOverlayRef} className="logo-overlay">
        <div ref={logoContainerRef} className="logo-container">
          <Logo ref={logoRef} />
        </div>
      </div>

      {/* your app content, hidden until we remove .show-splash */}
      <div className="app-shell">
        {children}
      </div>
    </>
  );
}
