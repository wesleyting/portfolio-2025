'use client';

import { useRef } from 'react';
import Copy from '@/components/Copy';
import Nav from '@/components/Nav'; // or Menu, whatever you named it
import Link from 'next/link';
import HoverSplitText from '@/components/HoverSplitText';

export default function Page() {
  const containerRef = useRef(null);

  return (
    <>
      <Nav containerRef={containerRef} />
      <div className="container" ref={containerRef}>
        <div className="page-header">
          <Copy delay={0.3}>
            <h1>WEB DEVELOPER</h1>
            <Link href="/about">test</Link>
<HoverSplitText text="Sound Track Record" size="72px" />
          </Copy>

        </div>
      </div>
    </>
  );
}
