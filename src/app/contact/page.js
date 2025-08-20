'use client';

import { useRef } from 'react';
import Copy from '@/components/Copy';
import Nav from '@/components/Nav'; // or Menu, whatever you named it

export default function Page() {
  const containerRef = useRef(null);

  return (
    <>
      <Nav containerRef={containerRef} />
      <div className="container" ref={containerRef}>
        <div className="page-header">
          <Copy delay={0.3}>
            <h1>Get In Touch</h1>
          </Copy>
        </div>
      </div>
    </>
  );
}
