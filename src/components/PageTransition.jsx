"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "gsap";
import Logo from "./Logo";

// central timing controls
const DUR = {
  cover: 0.4,        // was 0.4
  reveal: 0.4,       // was 0.4
  draw: 1.2,          // was 2
  fill: 0.6,          // was 1
  blockStagger: 0.03 // was 0.02
};
// optional slight staggering for logo paths
const LOGO_STAGGER = 0.0; // set to 0.06 for a gentle cascade

const PageTransition = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const logoOverlayRef = useRef(null);
  const logoRef = useRef(null);
  const blocksRef = useRef([]);
  const isTransitioning = useRef(false);
  const pathLengthsRef = useRef([]); // all paths
  const revealTimeoutRef = useRef(null);

  const handleRouteChange = useCallback((url) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    coverPage(url);
  }, []);

  const onAnchorClick = useCallback(
    (e) => {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }
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
      e.preventDefault();
      const href = e.currentTarget.href;
      const url = new URL(href).pathname;
      if (url !== pathname) handleRouteChange(url);
    },
    [pathname, handleRouteChange]
  );

  const revealPage = useCallback(() => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

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

    // safety
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

  useEffect(() => {
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

    gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

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

    revealPage();

    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => link.addEventListener("click", onAnchorClick));

    return () => {
      links.forEach((link) => link.removeEventListener("click", onAnchorClick));
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [router, pathname, onAnchorClick, revealPage]);

  const coverPage = (url) => {
    if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto";
    if (logoOverlayRef.current) logoOverlayRef.current.style.pointerEvents = "auto";

    const paths = logoRef.current.querySelectorAll("path");

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
          stagger: LOGO_STAGGER, // keep 0 for all together
        },
        "-=0.4"
      )
      .to(
        paths,
        {
          fill: "white",
          duration: DUR.fill,
          ease: "power2.out",
          stagger: LOGO_STAGGER,
        },
        "-=0.5"
      )
      .to(logoOverlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.out",
      });
  };

  return (
    <>
      <div ref={overlayRef} className="transition-overlay" />
      <div ref={logoOverlayRef} className="logo-overlay">
        <div className="logo-container">
          <Logo ref={logoRef} />
        </div>
      </div>
      {children}
    </>
  );
};

export default PageTransition;
