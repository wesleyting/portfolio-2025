"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";
import Logo from "./Logo";

// central timing controls
const DUR = {
  cover: 0.4,
  reveal: 0.4,
  draw: 1.2,
  fill: 0.6,
  blockStagger: 0.03,
};

// optional slight staggering for logo paths
const LOGO_STAGGER = 0.0; // set to 0.06 for a gentle cascade

export default function PageTransition({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const overlayRef = useRef(null);      // holds the 12 blocks
  const logoOverlayRef = useRef(null);  // dark screen with logo
  const logoRef = useRef(null);         // <Logo/> svg root
  const blocksRef = useRef([]);         // the 12 block divs
  const isTransitioning = useRef(false);

  const pathLengthsRef = useRef([]);    // stroke lengths for all paths
  const revealTimeoutRef = useRef(null);

  /* -----------------------------
   * Helpers
   * ----------------------------*/

  const onAnchorClick = useCallback(
    (e) => {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }
      // allow new tabs/middle-click/etc.
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 ||
        e.currentTarget.target === "_blank"
      ) {
        return;
      }
      const href = e.currentTarget.href;
      if (!href) return;
      const url = new URL(href);
      if (url.origin !== window.location.origin) return; // external

      e.preventDefault();
      const nextPath = url.pathname;
      if (nextPath !== pathname) {
        handleRouteChange(nextPath);
      }
    },
    [pathname]
  );

  const revealPage = useCallback(() => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

    // ensure blocks are present and fully covered (scaleX:1 from right) before revealing
    gsap.set(blocksRef.current, { scaleX: 1, transformOrigin: "right" });

    gsap.to(blocksRef.current, {
      scaleX: 0,
      duration: DUR.reveal,
      stagger: DUR.blockStagger,
      ease: "power3.out",
      transformOrigin: "right",
      onComplete: () => {
        isTransitioning.current = false;
        if (overlayRef.current) overlayRef.current.style.pointerEvents = "none";
        if (logoOverlayRef.current) logoOverlayRef.current.style.pointerEvents = "none";
      },
    });

    // safety in case a block sticks
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
            if (overlayRef.current) overlayRef.current.style.pointerEvents = "none";
            if (logoOverlayRef.current) logoOverlayRef.current.style.pointerEvents = "none";
          },
        });
      }
    }, 900);
  }, []);

  const playInitialIntro = useCallback(() => {
    if (!logoOverlayRef.current || !logoRef.current) {
      // if logo overlay is missing for any reason, just reveal
      revealPage();
      return;
    }

    // enable overlay interaction during intro (prevent clicks)
    logoOverlayRef.current.style.pointerEvents = "auto";
     if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto";

    const paths = logoRef.current.querySelectorAll("path");

    // reset stroke/filled state before drawing
    paths.forEach((p, i) => {
      gsap.set(p, {
        strokeDasharray: pathLengthsRef.current[i],
        strokeDashoffset: pathLengthsRef.current[i],
        fill: "transparent",
      });
    });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        // disable overlay interaction again
        if (logoOverlayRef.current) logoOverlayRef.current.style.pointerEvents = "none";
        // after logo intro, peel blocks to reveal content
        revealPage();
      },
    });

  tl.set(logoOverlayRef.current, { opacity: 1 })                // show dark screen
    .to(paths, {                                                // draw
      strokeDashoffset: 0,
      duration: DUR.draw,
      ease: "power2.inOut",
      stagger: LOGO_STAGGER,
    }, 0)
    .to(paths, { fill: "white", duration: DUR.fill, stagger: LOGO_STAGGER }, "-=0.4")
    // *** PRE-COVER with blocks while logo is still visible ***
    .set(blocksRef.current, { scaleX: 1, transformOrigin: "right" }, "-=0.05")
    // now fade the logo away; blocks are already covering, so no flash
    .to(logoOverlayRef.current, { opacity: 0, duration: 0.2 });
}, [revealPage]);

  const coverPage = useCallback(
    (url) => {
      if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto";
      if (logoOverlayRef.current) logoOverlayRef.current.style.pointerEvents = "auto";

      // mark next page mount as internal nav → skip intro once
      try {
        window.sessionStorage.setItem("skipIntroOnce", "1");
      } catch {}

      const paths = logoRef.current?.querySelectorAll("path") ?? [];

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
        .set(
          paths,
          (i) => ({
            strokeDashoffset: pathLengthsRef.current[i],
            fill: "transparent",
          }),
          "-=0.2"
        )
        .to(
          paths,
          {
            strokeDashoffset: 0,
            duration: DUR.draw,
            ease: "power2.inOut",
            stagger: LOGO_STAGGER,
          },
          "-=0.4"
        )
        .to(
          paths,
          { fill: "white", duration: DUR.fill, ease: "power2.out", stagger: LOGO_STAGGER },
          "-=0.5"
        )
        .to(logoOverlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.out" });
    },
    [router]
  );

  const handleRouteChange = useCallback(
    (url) => {
      if (isTransitioning.current) return;
      isTransitioning.current = true;
      coverPage(url);
    },
    [coverPage]
  );

  /* -----------------------------
   * Mount / Update
   * ----------------------------*/
  useEffect(() => {
    // (1) build 12 blocks in the overlay
    const createBlocks = () => {
      if (!overlayRef.current) return;
      overlayRef.current.innerHTML = "";
      blocksRef.current = [];
      for (let i = 0; i < 12; i++) {
        const block = document.createElement("div");
        block.className = "block";
        overlayRef.current.appendChild(block);
        blocksRef.current.push(block);
      }
    };

    createBlocks();

    // initial state: blocks hidden from left
    gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

    // (2) measure logo path lengths (needed for both intro and cover)
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

    // (3) Decide intro vs reveal-on-mount
    const navEntry =
      typeof performance !== "undefined"
        ? performance.getEntriesByType("navigation")[0]
        : undefined;
    const isBackForward = navEntry?.type === "back_forward";

    const skipIntroOnce =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("skipIntroOnce") === "1";

    if (skipIntroOnce || isBackForward) {
      // clear one-shot flag so later direct loads still play intro
      try {
        window.sessionStorage.removeItem("skipIntroOnce");
      } catch {}
      revealPage();
    } else {
      // direct land or full reload → play intro every time
      playInitialIntro();
    }

    // (4) intercept internal links
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => link.addEventListener("click", onAnchorClick));

    return () => {
      links.forEach((link) => link.removeEventListener("click", onAnchorClick));
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [pathname, onAnchorClick, revealPage, playInitialIntro]);

  return (
    <>
      {/* overlay with 12 blocks (built via JS) */}
      <div ref={overlayRef} className="transition-overlay" />
      {/* dark screen with logo */}
      <div ref={logoOverlayRef} className="logo-overlay">
        <div className="logo-container">
          <Logo ref={logoRef} />
        </div>
      </div>

      {children}
    </>
  );
}
