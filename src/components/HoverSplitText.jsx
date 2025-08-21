'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './hoversplit.module.css';

export default function HoverSplitText({
  text = 'Hover me',
  size = '64px',
  uppercase = true,
  className = '',
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const item = root.querySelector(`.${styles.item}`);

    const playEffect = (fromIndex = 'center') => {
      const visible = item.querySelectorAll(`.${styles.visible} span`);
      const hidden  = item.querySelectorAll(`.${styles.hidden} span`);
      if (!visible.length || !hidden.length) return;

      // prevent overlapping runs
      if (gsap.isTweening(visible) || gsap.isTweening(hidden)) return;

      gsap.to(visible, {
        yPercent: 100,
        ease: 'back.out(2)',
        duration: 0.6,
        stagger: { each: 0.023, from: fromIndex },
        onComplete: () => gsap.set(visible, { clearProps: 'all' }),
      });

      gsap.to(hidden, {
        yPercent: 100,
        ease: 'back.out(2)',
        duration: 0.6,
        stagger: { each: 0.023, from: fromIndex },
        onComplete: () => gsap.set(hidden, { clearProps: 'all' }),
      });
    };

    const onMouseOver = (e) => {
      if (!e.target.classList.contains(styles.letter)) return;
      const indexHover = Array.from(e.target.parentNode.children).indexOf(e.target);
      playEffect(indexHover);
    };

    const onMouseLeave = () => {
      // just play the effect again from center (or you can reuse last hovered index if you store it)
      playEffect('center');
    };

    item.addEventListener('mouseover', onMouseOver);
    item.addEventListener('mouseleave', onMouseLeave);

    return () => {
      item.removeEventListener('mouseover', onMouseOver);
      item.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.effect} ${className}`}
      style={{ textTransform: uppercase ? 'uppercase' : 'none' }}
    >
      <div className={styles.item} style={{ fontSize: size }}>
        <span className={styles.hidden}>{splitToSpans(text)}</span>
        <span className={styles.visible}>{splitToSpans(text, true)}</span>
      </div>
    </div>
  );
}

function splitToSpans(text, markLetters = false) {
  return text.split('').map((ch, idx) => {
    const isSpace = ch === ' ';
    return (
      <span
        key={idx}
        className={markLetters && !isSpace ? styles.letter : undefined}
        dangerouslySetInnerHTML={{ __html: isSpace ? '&nbsp;' : ch }}
      />
    );
  });
}
