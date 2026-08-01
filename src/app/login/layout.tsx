import Image from 'next/image';
import React from 'react';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className='fixed inset-0 w-screen h-screen flex items-center justify-center px-4 overflow-hidden bg-black animate-fadeIn overscroll-y-contain'
    >
      <Image
        src='/loginimg.webp'
        alt=''
        fill
        priority
        sizes='100vw'
        quality={70}
        className='object-cover object-center'
      />
      <div className='absolute inset-0 bg-black/50' />
      <div className='relative z-10 flex w-full items-center justify-center'>
        {children}
      </div>
    </div>
  );
}
