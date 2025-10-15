'use client';

import { useRef } from 'react';
import Nav from '@/components/Nav'; // or Menu, whatever you named it
import Hero from '@/components/Hero';


export default function Page() {
  const containerRef = useRef(null);

  return (
    <>
      <Nav containerRef={containerRef} />
      <div  ref={containerRef}>
       
      <Hero />


        
      </div>
      
    </>
  );
}
